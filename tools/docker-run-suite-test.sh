#!/bin/sh

docker-compose -f ./docker/suite-dev.docker-compose.yml up --build &

# echo "Waiting for dev server to launch on localhost:3000..."

while ! nc -z localhost 3000; do   
    sleep 1
done

yarn cypress open \
--config baseUrl=http://localhost:3000 \
--browser chrome \
--project ./packages/integration-tests/projects/suite-web