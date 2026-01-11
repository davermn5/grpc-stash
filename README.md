## Installation Instructions

### Same Server (server and client)
1.vagrant up
2.vagrant ssh
3.cd /vagrant/app/
4.npm install
5.cd /vagrant/app/routeguide/dynamic_codegen
6.node /vagrant/app/routeguide/dynamic_codegen/route_guide_server.js
7.(Then, in a separate terminal): node /vagrant/app/routeguide/dynamic_codegen/route_guide_client.js 


### Different Servers
#### Update the IPv4 value within route_guide_server.js and route_guide_client.js
*Check the following resources into version control:
app/
 - protos/route_guide.proto
 - routeguide/
  --dynamic_codegen/route_guide_server.js
  --dynamic_codegen/route_guide_client.js
  --dynamic_codegen/route_guide_db.json
 - package.json
