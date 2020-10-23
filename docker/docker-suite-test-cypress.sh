#!/usr/bin/env bash

set -e -o pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"
source _config.sh

exec ./docker-compose exec test-runner test-cypress.sh
