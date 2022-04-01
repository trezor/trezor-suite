#!/usr/bin/env bash
set -e

xhost +

docker-compose -f ./docker/docker-compose.connect-karma-test.yml up --build --abort-on-container-exit
