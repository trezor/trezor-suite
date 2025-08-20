#!/usr/bin/env bash
set -e

LOCAL_USER_ID="$(id -u "$USER")"
export LOCAL_USER_ID
export TEST_FILE=$1
export URL=$URL
export TREZOR_CONNECT_SRC=$TREZOR_CONNECT_SRC
export CORE_IN_POPUP=$CORE_IN_POPUP
export IS_WEBEXTENSION=$IS_WEBEXTENSION
export MOBILE=$MOBILE
export GITHUB_ACTION=$GITHUB_ACTION
export CURRENTS_PROJECT_ID=$CURRENTS_PROJECT_ID
export CURRENTS_RECORD_KEY=$CURRENTS_RECORD_KEY
export CURRENTS_CI_BUILD_ID=$CURRENTS_CI_BUILD_ID

docker compose -f ./docker/docker-compose.connect-popup-ci.yml up --build --abort-on-container-exit
