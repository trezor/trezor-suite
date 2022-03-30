#!/usr/bin/env bash
set -e

xhost +

cp -r ./packages/connect-iframe/build ./packages/integration-tests/projects/connect-iframe

docker-compose -f ./docker/docker-compose.connect-iframe-test.yml up --build --abort-on-container-exit
