#!/usr/bin/env bash

set -e -o pipefail

goodbye() {
  echo "test-runner service is down"
}

trap goodbye EXIT

echo "test-runner service is up"

while true; do
  sleep 10
done
