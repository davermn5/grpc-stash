![Static Badge](https://img.shields.io/badge/github-repo-blue?style=for-the-badge&logo=github)  ![Static Badge](https://img.shields.io/badge/build-passing-brightgreen?style=for-the-badge)


## Installation Instructions

### VirtualBox & Vagrant - For Same Server (hosts server and client)
1. vagrant up
2. vagrant ssh
3. cd /vagrant/app/
4. npm install
5. cd /vagrant/app/routeguide/dynamic_codegen
6. node /vagrant/app/routeguide/dynamic_codegen/route_guide_server.js
7. (Then, in a separate terminal): node /vagrant/app/routeguide/dynamic_codegen/route_guide_client.js 


### For Different Servers (host separate server and client)
* For both server and client files, update the IPv4 and port, then Save.
