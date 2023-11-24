#!/usr/bin/env bash
set -e

xhost +
LOCAL_USER_ID="$(id -u "$USER")"
export LOCAL_USER_ID
export TEST_FILE=$1

DEV_SERVER_URL="https://suite.corp.sldev.cz"
LOCAL_SERVER_URL="http://localhost:8088"
CONNECT_VERSION="9.0.10"
URL="${DEV_SERVER_URL}/connect/npm-release/connect-${CONNECT_VERSION}/?trezor-connect-src=${LOCAL_SERVER_URL}/"
echo "URL: ${URL}"
export URL


# Make sure you run this with VPN connected otherwise previos versions of connect will not be available.

docker-compose -f ./docker/docker-compose.connect-popup-test.yml up --build --abort-on-container-exit
