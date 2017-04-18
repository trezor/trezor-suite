#!/usr/bin/env bash

# run as root; mainly for travis

wget -qO- https://deb.nodesource.com/setup_4.x | sudo bash -
sudo apt-get install nodejs
sudo npm install -g yarn
yarn
