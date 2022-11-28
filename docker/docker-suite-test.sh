#!/usr/bin/env bash
set -e

# todo: resolve selective xhost permissions
# todo: resolve generated files permissions

xhost +
LOCAL_USER_ID=$(id -u "$USER")
export LOCAL_USER_ID


CONTAINERS="trezor-user-env-unix suite-dev bitcoin-regtest"

if [ "$1" == 'playwright' ]
then
    CONTAINERS="${CONTAINERS} test-open-playwright"
fi

if [ "$1" == 'electrum' ]
then
    CONTAINERS="${CONTAINERS} electrum-regtest"
fi

if [ "$1" == 'playwright' ]; then
    CONTAINERS="${CONTAINERS} test-open-playwright"
else
    CONTAINERS="${CONTAINERS} test-open-cypress"
fi

echo "${CONTAINERS}"

docker-compose -f ./docker/docker-compose.suite-test.yml up --build --abort-on-container-exit --force-recreate ${CONTAINERS}
