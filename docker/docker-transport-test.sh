#!/usr/bin/env bash
set -e

docker compose -f ./docker/docker-compose.transport-test.yml pull
docker compose -f ./docker/docker-compose.transport-test.yml up --build --abort-on-container-exit --force-recreate
