#!/usr/bin/env bash
set -e

# todo: resolve selective xhost permissions
# todo: resolve generated files permissions

xhost +
export LOCAL_USER_ID=`id -u $USER`

docker-compose -f ./docker/docker-compose.connect-explorer-test.yml up --build --abort-on-container-exit
