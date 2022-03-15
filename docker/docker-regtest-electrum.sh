#!/usr/bin/env bash
set -e

export LOCAL_USER_ID=`id -u $USER`

docker-compose -f ./docker/docker-compose.regtest-electrum.yml up --build --abort-on-container-exit --force-recreate

