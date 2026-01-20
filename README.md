![Static Badge](https://img.shields.io/badge/github-repo-blue?style=plastic&logo=github)  ![Static Badge](https://img.shields.io/badge/build-passing-brightgreen?style=plastic)


## Installation Instructions

### VirtualBox & Vagrant - For the Same Server (hosts both server and client)
1. vagrant up 
2. vagrant ssh
3. cd /vagrant/app/routeguide/dynamic_codegen
4. node /vagrant/app/routeguide/dynamic_codegen/route_guide_server.js
5. (Then, in a separate terminal in the same project directory): vagrant ssh
    - node /vagrant/app/routeguide/dynamic_codegen/route_guide_client.js 

### (optional) For Different Servers (each acting as client)
  * Perform Steps 1-5 above
  * nano '/vagrant/app/routeguide/dynamic_codegen/route_guide_client.js'
    - Locate the remote (target) IPv4 and port settings, then Ctrl+O (save).
  * node /vagrant/app/routeguide/dynamic_codegen/route_guide_client.js 
