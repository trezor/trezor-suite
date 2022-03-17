#!/usr/bin/env bash
set -e

export COMPOSE_FILE=docker/docker-compose.transport-test.yml

docker-compose pull
docker-compose up -d trezor-user-env-unix
docker-compose run test-run
