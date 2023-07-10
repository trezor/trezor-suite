#!/usr/bin/env bash
set -e

docker-compose -f ./docker/docker-compose.connect-popup-test.yml up --build --abort-on-container-exit
