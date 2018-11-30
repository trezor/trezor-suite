#!/usr/bin/env bash

# run as root; mainly for travis

apt-get install -y wget gdebi
wget -O bitcore.deb 'https://www.dropbox.com/s/txkzsa1m2a7mp64/bitcore.deb?dl=1'
gdebi -n bitcore.deb
