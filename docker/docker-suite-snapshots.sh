#!/bin/sh

# todo: I am not sure whether locally generated snapshots won't somethimes differ from CI generated, this is to be tested

xhost +
export LOCAL_USER_ID=`id -u $USER`
export CYPRESS_SNAPSHOT=1
export CYPRESS_updateSnapshots=1

docker-compose -f ./docker/docker-compose.suite-test.yml up --build --abort-on-container-exit
