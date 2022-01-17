#!/usr/bin/env bash
set -e

export COMPOSE_FILE=docker/docker-compose.transport-test.yml

git submodule add --force https://github.com/trezor/trezor-common.git trezor-common
yarn pbjs -t json -p ./trezor-common/protob -o ./packages/integration-tests/projects/transport/messages.json --keep-case messages-bitcoin.proto messages-bootloader.proto messages-common.proto messages-crypto.proto messages-debug.proto messages-management.proto
docker-compose pull
docker-compose up -d trezor-user-env-unix
docker-compose run test-run
