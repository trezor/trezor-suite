#!/usr/bin/env bash

# run as root; mainly for travis

apt-get install wget gdebi
wget -O bitcore.deb 'https://www.dropbox.com/s/txkzsa1m2a7mp64/bitcore.deb?dl=1'
gdebi -n bitcore.deb
rm bitcore.deb
nodejs test_helpers/_node_server.js &

#su bitcore-regtest -c /opt/satoshilabs/bitcore-regtest/bitcore/bin/bitcored -s /bin/bash > /opt/satoshilabs/logs 2>&1 &
