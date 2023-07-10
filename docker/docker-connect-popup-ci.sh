#!/usr/bin/env bash
set -e

LOCAL_USER_ID="$(id -u "$USER")"
export LOCAL_USER_ID
export TEST_FILE=$1

docker-compose -f ./docker/docker-compose.connect-popup-test.yml up --build --abort-on-container-exit
