#!/usr/bin/env bash
set -e

xhost +

LOCAL_USER_ID="$(id -u "$USER")"
export LOCAL_USER_ID
HEADLESS=false
export HEADLESS
export URL=$URL


docker compose -f ./docker/docker-compose.connect-webextension-test.yml up --build --abort-on-container-exit
