#!/bin/sh

docker volume create nodemodules

docker-compose -f ./docker/docker-compose.suite-base.yml run --rm suite-install


