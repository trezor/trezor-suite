#!/bin/sh

docker-compose -f ./docker/suite-dev.docker-compose.yml up --build &

# echo "Waiting for dev server to launch on localhost:3000..."

# while ! nc -z localhost 3000; do   
#   sleep 1
# done

google-chrome http://localhost:3000
google-chrome ./docker/trezor-env/websocket-client.html
# google-chrome http://127.0.0.1:21325/status/
