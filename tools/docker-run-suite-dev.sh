#!/bin/sh

# script that will spin up local dev environment for trezor-suite

# todos:
# - figure out how to handle hot reload
# - rebuild libs (and maybe packages) only if they changed
# - improve "controller" html page to provide some basic info on development setup

# todo: resolve selective xhost permissions
xhost +

docker-compose -f ./docker/docker-compose.suite-dev.yml up --build --remove-orphans -d

while ! nc -z localhost 3000; do
  echo "Waiting for dev server to launch on localhost:3000...(it takes really long now)"
  sleep 3
done

google-chrome http://localhost:3000
google-chrome ./docker/trezor-env/websocket-client.html

#google-chrome http://127.0.0.1:21325/status/


