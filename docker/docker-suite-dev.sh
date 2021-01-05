#!/usr/bin/env bash
set -e

# script that will spin up local dev environment for trezor-suite

# todos:
# - improve "controller" html page to provide some basic info on development setup
# - resolve selective xhost permissions

xhost +

export LOCAL_USER_ID=`id -u $USER`
docker-compose -f ./docker/docker-compose.suite-dev.yml up --build --remove-orphans -d

while ! nc -z localhost 3000; do
  echo "Waiting for dev server to launch on localhost:3000..."
  sleep 3
done

google-chrome http://localhost:3000
google-chrome ./docker/trezor-user-env/websocket-client.html

echo "containers now run in detached mode, to see logs type: "
echo "trezor-env logs:"
echo "docker logs -f $(docker ps -aqf name=trezor-env)"
echo "suite-dev logs:"
echo "docker logs -f $(docker ps -aqf name=suite-dev)"
echo "to stop them: "
echo "docker-compose -f ./docker/docker-compose.suite-dev.yml down"
