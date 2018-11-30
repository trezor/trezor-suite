#!/usr/bin/env bash

su bitcore-regtest -c /opt/satoshilabs/bitcore-regtest/bitcore/bin/bitcored -s /bin/bash > /opt/satoshilabs/bitcore-regtest/home/logs 2>&1 &
