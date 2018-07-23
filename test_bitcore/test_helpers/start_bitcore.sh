#!/usr/bin/env bash

if [ $USER = "bitcore-regtest" ]
then
  /opt/satoshilabs/bitcore-regtest/bitcore/bin/bitcored > /opt/satoshilabs/bitcore-regtest/home/logs 2>&1 & 
else
  su bitcore-regtest -c /opt/satoshilabs/bitcore-regtest/bitcore/bin/bitcored -s /bin/bash > /opt/satoshilabs/bitcore-regtest/home/logs 2>&1 & 
fi
