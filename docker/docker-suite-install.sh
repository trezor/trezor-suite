#!/usr/bin/env bash
set -e

LOCAL_USER_ID="$(id -u "$USER")"
docker compose -f ./docker/docker-compose.suite-base.yml run -e LOCAL_USER_ID="$LOCAL_USER_ID" --rm suite-install
