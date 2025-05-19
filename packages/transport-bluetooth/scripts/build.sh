#!/usr/bin/env bash
set -e

# This has to be built using x86 docker image arm image is not working. For building on arm mac use --platform linux/amd64 for the build command.
docker build . -f ./scripts/Dockerfile -t trezor-bluetooth-image .
docker create --name trezor-bluetooth-container trezor-bluetooth-image
docker cp trezor-bluetooth-container:/output/. ../suite-data/files/bin/bluetooth
docker rm trezor-bluetooth-container
