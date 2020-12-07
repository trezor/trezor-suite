#!/bin/sh

# todo: resolve selective xhost permissions
# todo: resolve generated files permissions

xhost +
export LOCAL_USER_ID=`id -u $USER`

docker-compose -f ./docker/docker-compose.suite-test.yml up --build --abort-on-container-exit trezor-user-env-unix suite-dev test-open
