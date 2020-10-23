#!/usr/bin/env bash

set -e -o pipefail

# open a tunnel for trezor bridge (in background)
sshpass -f /run/secrets/root_password ssh -o StrictHostKeyChecking=no -4 -L 9001:127.0.0.1:9001 -N root@trezor_user_env &

set -x
cypress open --project packages/integration-tests/projects/suite-web
