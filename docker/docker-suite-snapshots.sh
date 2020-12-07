#!/bin/sh

# todo: resolve selective xhost permissions
# todo: resolve generated files permissions

xhost +
export LOCAL_USER_ID=`id -u $USER`
export CYPRESS_SNAPSHOT=1
docker-compose -f ./docker/docker-compose.suite-ci.yml up --build --abort-on-container-exit
