#!/usr/bin/env bash
set -e

xhost +
LOCAL_USER_ID="$(id -u "$USER")"
export LOCAL_USER_ID
export TEST_FILE=$1
export URL=https://suite.corp.sldev.cz/connect/feat/connect-explorer-serviceworker-proxy/

docker-compose -f ./docker/docker-compose.connect-popup-test.yml up --build --abort-on-container-exit
