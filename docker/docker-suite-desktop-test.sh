#!/usr/bin/env bash
set -e

# todo: resolve selective xhost permissions
# todo: resolve generated files permissions

xhost +
LOCAL_USER_ID="$(id -u "$USER")"
export LOCAL_USER_ID
export TEST_FILE=$1

docker-compose -f ./docker/docker-compose.suite-desktop-test.yml up --build --abort-on-container-exit --force-recreate
