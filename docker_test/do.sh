#!/usr/bin/env bash
set -ex
cd hd-wallet
sudo nodejs test_helpers/_node_server.js &
