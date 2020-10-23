#!/usr/bin/env bash

set -e -o pipefail

echo "suite-dev service is up"

goodbye() {
  echo "suite-dev service is down"
}

trap goodbye EXIT

set -x

if [[ -n "$NO_AUTO_BUILD" ]]; then

  # user wants to do this on her own, let's just idle here
  while true; do
    sleep 10
  done

else

  # update dependencies
  yarn

  # run the dev web
  yarn suite:dev

fi
