#!/usr/bin/env bash

set -e -o pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"
source _config.sh

./docker-compose down

set +e
docker volume rm trezor_suite_code
docker volume rm trezor_suite_cache
set -e
