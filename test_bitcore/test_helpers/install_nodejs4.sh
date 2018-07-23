#!/usr/bin/env bash

# run as root; mainly for travis

#wget -qO- https://deb.nodesource.com/setup_4.x | sudo bash -
sudo bash ./test_helpers/install_node_setup_4.sh
sudo apt-get install nodejs
sudo npm install -g yarn
yarn
