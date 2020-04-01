#!/bin/sh

# todo: resolve selective xhost permissions

xhost +
export LOCAL_USER_ID=`id -u $USER`

docker-compose -f ./docker/docker-compose.suite-test.yml up --build --abort-on-container-exit


