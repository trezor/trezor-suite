#!/usr/bin/env bash
set -e

export LOCAL_USER_ID=`id -u $USER`

docker-compose -f ./docker/docker-compose.blockchain-link-test.yml up --build --abort-on-container-exit --force-recreate
