#!/usr/bin/env bash

set -e -o pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"
source _config.sh

set -x
exec ./docker-compose exec test-runner test-unit.sh "$@"
