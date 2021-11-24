#!/usr/bin/env bash

# This script runs trezor-link tests.
# It spins up trezor-user-env and sets required evironment variables.

set -euo pipefail

USER_ENV_IMAGE="registry.gitlab.com/satoshilabs/trezor/trezor-user-env/trezor-user-env"

cleanup() {
  if [ -n "${dockerID-}" ]; then
    echo "Stopping container with an ID $dockerID"
    docker stop "$dockerID" && echo "trezor-user-env stopped"
  fi
}

trap cleanup EXIT

# Ports
# 9001  - websocket server, communication test case > user-env (setup etc...)
# 21326 - trezord proxy. beacuse of trezord CORS check
# 21325 - original trezord port redirected to trezor-user-env proxy

runDocker() {
  echo "Pulling latest trezor-user-env"
  docker pull "$USER_ENV_IMAGE"
  dockerID=$(
    docker run -d \
      -e SDL_VIDEODRIVER="dummy" \
      -p "9001:9001" \
      -p "21326:21326" \
      -p "21325:21326" \
      "$USER_ENV_IMAGE"
  )
  docker logs -f "$dockerID" &
  echo "Running docker container with ID $dockerID"
}

waitForEnv() {
  echo "Waiting for trezor-user-env to load up..."
  counter=0
  max_attempts=60

  # there is no official support for websockets in curl
  # trezor-user-env websocket server will return HTTP/1.1 426 Upgrade Required error with "Upgrade: websocket" header
  until (curl -i -s -I http://localhost:9001 | grep 'websocket'); do
    if [ ${counter} -eq ${max_attempts} ]; then
      echo "trezor-user-env is not running. exiting"
      exit 1
    fi
    counter=$(($counter+1))
    printf "."
    sleep 1
  done

  echo "trezor-user-env loaded up"
}

show_usage() {
  echo "Usage: run [OPTIONS] [ARGS]"
  echo ""
  echo "Options:"
  echo "  -d       Disable docker. Useful when running own instance of trezor-user-env. default: enabled"
}

# default options
DOCKER=true
TEST_SCRIPT="yarn example:bridge"

# user options
OPTIND=1
while getopts ":i:e:f:s:hdc" opt; do
  case $opt in
  d)
    DOCKER=false
    ;;
  s)
    TEST_SCRIPT=$OPTARG
    ;;
  h) # Script usage
    show_usage
    exit 0
    ;;
  \?)
    echo "invalid option $OPTARG"
    exit 1
    ;;
  esac
done

shift $((OPTIND - 1))

run() {
  if [ $DOCKER = true ]; then
    runDocker
  fi

  waitForEnv

  echo "Running ${TEST_SCRIPT}"

  # run actual test script
  ${TEST_SCRIPT}
}

run
