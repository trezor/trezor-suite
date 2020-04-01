#!/bin/sh

USER=$(ls -lnd . | awk '{ print $3 }')
GROUP=$(ls -lnd . | awk '{ print $4 }')

docker volume create nodemodules

docker-compose -f ./docker/docker-compose.suite-base.yml run --user="$USER:$GROUP" --rm suite-install


