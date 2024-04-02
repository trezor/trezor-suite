#!/usr/bin/env bash
set -e

LOCAL_USER_ID="$(id -u "$USER")"
export LOCAL_USER_ID

docker compose -f ./docker/docker-compose.coinjoin-backend.yml up --build --abort-on-container-exit --force-recreate
