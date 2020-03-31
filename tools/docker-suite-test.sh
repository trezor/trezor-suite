#!/bin/sh

# todo: resolve selective xhost permissions
xhost +

docker-compose -f ./docker/docker-compose.suite-test.yml up --build
