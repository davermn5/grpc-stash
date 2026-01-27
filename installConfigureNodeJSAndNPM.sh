#!/usr/bin/env bash


mkdir node/etc 

bash -c 'echo "prefix=/usr/local" ' > node/etc/npmrc

mv node /opt/

chown -R root: /opt/node

ln -s /opt/node/bin/node /usr/local/bin/node

ln -s /opt/node/bin/npm /usr/local/bin/npm

node -v

npm -v 

cd /vagrant/app && npm install
