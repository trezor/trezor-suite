#!/usr/bin/env bash
set -e

xhost +
export LOCAL_USER_ID=`id -u $USER`

docker-compose -f ./docker/docker-compose.connect-popup-test.yml up --build --abort-on-container-exit
