#!/usr/bin/env bash

# script that displays env for local dev environment for trezor-suite

set -e -o pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"
source _config.sh

export_trezor_suite_env

env | grep TREZOR_SUITE
