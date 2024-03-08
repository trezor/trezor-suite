#!/usr/bin/env bash
set -e

LOCAL_USER_ID="$(id -u "$USER")"
export LOCAL_USER_ID
export TEST_FILE=$1
export URL=$URL
export TREZOR_CONNECT_SRC=$TREZOR_CONNECT_SRC

docker-compose -f ./docker/docker-compose.connect-popup-ci.yml up --build --abort-on-container-exit