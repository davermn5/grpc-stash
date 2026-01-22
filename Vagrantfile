# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure("2") do |config|

  config.vm.box = "ubuntu/bionic64" 

  config.vm.network "forwarded_port", guest: 80, host: 880

  config.ssh.forward_agent = true

  config.vm.network :private_network, ip: "192.168.58.28"

  config.vm.hostname = "grpc-stash" 

  config.vm.provider :virtualbox do |vb|
    vb.customize [
      "modifyvm", :id,
      "--memory", "4096"
    ]
  end


  config.vm.provision :shell, :inline => " sudo apt-get update -y "

  # Download NodeJS and NPM bundle:
  config.vm.provision :shell, :inline => " wget https://nodejs.org/dist/v14.21.3/node-v14.21.3-linux-x64.tar.xz "
  config.vm.provision :shell, :inline => " mkdir node && tar xvf node-v*.tar.?z --strip-components=1 -C ./node"

  # Install and Configure NodeJS and NPM
  config.vm.provision :shell, :path => "installConfigureNodeJSAndNPM.sh"

  #(optional): Fix "stdin: is not a tty" message
  config.ssh.shell = "bash -c 'BASH_ENV=/etc/profile exec bash'"  

end
