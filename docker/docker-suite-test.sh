#!/usr/bin/env bash
set -e

# todo: resolve selective xhost permissions
# todo: resolve generated files permissions

xhost +
LOCAL_USER_ID=$(id -u "$USER")
export LOCAL_USER_ID

docker compose -f ./docker/docker-compose.suite-test.yml up --build --abort-on-container-exit --force-recreate
