#!/usr/bin/env bash
set -e

xhost +
LOCAL_USER_ID="$(id -u "$USER")"
HEADLESS=false
export LOCAL_USER_ID
export HEADLESS

docker compose -f ./docker/docker-compose.connect-webextension-test.yml up --build --abort-on-container-exit
