#!/usr/bin/env bash
set -e

xhost +
LOCAL_USER_ID="$(id -u "$USER")"
export LOCAL_USER_ID
export TEST_FILE=$1
export TREZOR_CONNECT_SRC=http://localhost:8088/

docker-compose -f ./docker/docker-compose.connect-popup-test.yml up --build --abort-on-container-exit
