#!/bin/sh

export LOCAL_USER_ID=`id -u $USER`

docker-compose -f ./docker/docker-compose.suite-test.yml up --build --abort-on-container-exit trezor-user-env-mac suite-dev test-open
