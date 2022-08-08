#!/usr/bin/env bash

echo "Waiting for $1 to load up..."
counter=0
max_attempts=60

curl -i -s -I "$1"

until (curl -i -s -I --insecure "$1" | grep '200 OK'); do
  if [ ${counter} -eq ${max_attempts} ]; then
    echo "$1 is not running. exiting"
    exit 1
  fi
  counter=$((counter+1))
  printf "."
  sleep 1
done

echo "$1 loaded up"
