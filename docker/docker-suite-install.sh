#!/usr/bin/env bash
set -e

docker-compose -f ./docker/docker-compose.suite-base.yml run -e LOCAL_USER_ID=`id -u $USER` --rm suite-install
