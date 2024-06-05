#!/usr/bin/env bash
# shellcheck disable=SC2086

set -e

# todo: resolve selective xhost permissions
# todo: resolve generated files permissions

xhost +
LOCAL_USER_ID="$(id -u "$USER")"
export LOCAL_USER_ID
export TEST_FILE=$1

CONTAINERS="trezor-user-env-unix test-run"

if [ "$1" == 'coinjoin' ]
then
    CONTAINERS="${CONTAINERS} coinjoin-backend"
fi

if [ "$1" == 'electrum' ]
then
    CONTAINERS="${CONTAINERS} electrum-regtest"
fi

echo "${CONTAINERS}"

docker compose -f ./docker/docker-compose.suite-desktop-test.yml up --build --abort-on-container-exit --remove-orphans --force-recreate ${CONTAINERS}
