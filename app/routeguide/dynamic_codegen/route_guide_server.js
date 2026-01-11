// Server-side file

var PROTO_PATH = __dirname + '/../../protos/route_guide.proto';

var fs = require('fs');
var parseArgs = require('minimist');
var path = require('path');
var _ = require('lodash');
var grpc = require('@grpc/grpc-js');
var protoLoader = require('@grpc/proto-loader');
var packageDefinition = protoLoader.loadSync(
    PROTO_PATH,
    {keepCase: true,
     longs: String,
     enums: String,
     defaults: true,
     oneofs: true
    });
var routeguide = grpc.loadPackageDefinition(packageDefinition).routeguide;

var COORD_FACTOR = 1e7;

/**
 * A point represents a geospatial reference object, for example:
 * {latitude: number, longitude: number}
 * 
 * A landmark represents an object with a corresponding name and point (location), for example:
 * {name: string, location: point}. However, if the name==='' then its a point with no known landmark.
 */

/**
 * List of feature objects at points that have been requested so far.
 */
var feature_list = [];

/**
 * Get a landmark object at the given point, or creates one if it does not exist.
 * @param {point} point The point to check
 * @return {feature} The landmark object at the point. Note that an empty name
 *     indicates no landmark available to go off of.
 */
function checkFeature(point) {
  var feature;
  // Checks if a landmark is known for the provided point.
  for (var i = 0; i < feature_list.length; i++) {
    feature = feature_list[i];
    if (feature.location.latitude === point.latitude &&
        feature.location.longitude === point.longitude) {
      return feature;
    }
  }
  var name = '';
  feature = {
    name: name,
    location: point
  };
  return feature;
}

/**
 * Gets the landmark for a given known point
 * @param {EventEmitter} call Call object for the handler to process
 * @param {function(Error, feature)} callback Response callback
 */
function getFeature(call, callback) {
  callback(null, checkFeature(call.request));
}

/**
 * Acts as a container to pull-in the surface area of 2 given points and streams back the known landmarks.
 * @param {Writable} call Writable stream for responses with an additional
 *     request property for the request value.
 */
function listFeatures(call) {
  var lo = call.request.lo;
  var hi = call.request.hi;
  var left = _.min([lo.longitude, hi.longitude]);
  var right = _.max([lo.longitude, hi.longitude]);
  var top = _.max([lo.latitude, hi.latitude]);
  var bottom = _.min([lo.latitude, hi.latitude]);
  _.each(feature_list, function(feature) {
    if (feature.name === '') {
      return;
    }
    if (feature.location.longitude >= left &&
        feature.location.longitude <= right &&
        feature.location.latitude >= bottom &&
        feature.location.latitude <= top) {
      call.write(feature);
    }
  });
  call.end();
}

/**
 * Analyzes the distance between 2 points using the Haversine formula.
 * The formula is based on http://mathforum.org/library/drmath/view/51879.html.
 * @param start The starting point
 * @param end The end point
 * @return The distance between the points in meters
 */
function getDistance(start, end) {
  function toRadians(num) {
    return num * Math.PI / 180;
  }
  var R = 6371000;  // earth radius in metres
  var lat1 = toRadians(start.latitude / COORD_FACTOR);
  var lat2 = toRadians(end.latitude / COORD_FACTOR);
  var lon1 = toRadians(start.longitude / COORD_FACTOR);
  var lon2 = toRadians(end.longitude / COORD_FACTOR);

  var deltalat = lat2-lat1;
  var deltalon = lon2-lon1;
  var a = Math.sin(deltalat/2) * Math.sin(deltalat/2) +
      Math.cos(lat1) * Math.cos(lat2) *
      Math.sin(deltalon/2) * Math.sin(deltalon/2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Gathers the client-stream of points
 * Returns the stats for the stream (collection of points), for example shows:
 * -Number of points
 * -Number of known landmarks visited
 * -Total distance traveled
 * -Total time spent
 * @param {Readable} call The point stream
 * @param {function(Error, routeSummary)} callback invokes the callback function to pass the response to.
 */
function recordRoute(call, callback) {
  var point_count = 0;
  var feature_count = 0;
  var distance = 0;
  var previous = null;
  // Start a timer
  var start_time = process.hrtime();
  call.on('data', function(point) {
    point_count += 1;
    if (checkFeature(point).name !== '') {
      feature_count += 1;
    }
    /* For each point after the first, add the incremental distance from the
     * previous point to the total distance value */
    if (previous != null) {
      distance += getDistance(previous, point);
    }
    previous = point;
  });
  call.on('end', function() {
    callback(null, {
      point_count: point_count,
      feature_count: feature_count,
      // Cast the distance to an integer
      distance: distance|0,
      // End the timer
      elapsed_time: process.hrtime(start_time)[0]
    });
  });
}

var route_notes = {};

/**
 * Turn the point into a dictionary key.
 * @param {point} point The point to use
 * @return {string} The key for an object
 */
function pointKey(point) {
  return point.latitude + ' ' + point.longitude;
}

/**
 * routeChat handler. Receives a stream of message/location pairs, and responds
 * with a stream of all previous messages at each of those locations.
 * @param {Duplex} call The stream for incoming and outgoing messages
 */
function routeChat(call) {
  call.on('data', function(note) {
    var key = pointKey(note.location);
    /* For each note sent, respond with all previous notes that correspond to
     * the same point */
    if (route_notes.hasOwnProperty(key)) {
      _.each(route_notes[key], function(note) {
        call.write(note);
      });
    } else {
      route_notes[key] = [];
    }
    // Then add the new note to the list
    route_notes[key].push(JSON.parse(JSON.stringify(note)));
  });
  call.on('end', function() {
    call.end();
  });
}

/**
 * Get a new server with the handler functions in this file bound to the methods
 * it serves.
 * @return {Server} The new server object
 */
function getServer() {
  var server = new grpc.Server();
  server.addService(routeguide.RouteGuide.service, {
    getFeature: getFeature,
    listFeatures: listFeatures,
    recordRoute: recordRoute,
    routeChat: routeChat
  });
  return server;
}



//Main Entry point
// Note that the json (db) file resides within the same directory as client and server files.
if (require.main == module) {
  var routeServer = getServer();
  routeServer.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), () => {
    fs.readFile('./route_guide_db.json', function(err, data) {
      if (err) throw err;
      feature_list = JSON.parse(data);
      routeServer.start();
    });
  });
}

exports.getServer = getServer;

