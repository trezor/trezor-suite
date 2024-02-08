#!/usr/bin/env bash
set -e

docker build . -f ./scripts/Dockerfile -t trezor-bluetooth-image
docker create --name trezor-bluetooth-container trezor-bluetooth-image
docker cp trezor-bluetooth-container:/output/. ./bin
docker rm trezor-bluetooth-container
