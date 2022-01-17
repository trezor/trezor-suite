#!/usr/bin/env bash

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
