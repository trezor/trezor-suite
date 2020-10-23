#!/usr/bin/env bash

set -e -o pipefail

goodbye() {
  echo "user-env service is down"
}

trap goodbye EXIT

set -x
echo "user-env service is up"

# run ssh server for test-runner (in background)
/usr/sbin/sshd

# run simple web server (in background)
python3 --version
echo "Starting control web server on port 3001"
python3 -m http.server --directory /control-server 3001 &

# run trezor emulator
rm -rf /var/tmp/trezor.flash
trezorctl --version

# https://stackoverflow.com/questions/29663459/python-app-does-not-print-anything-when-running-detached-in-docker
export PYTHONUNBUFFERED=1
python3 ./main.py
