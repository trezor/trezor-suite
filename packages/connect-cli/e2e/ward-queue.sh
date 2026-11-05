#!/usr/bin/env bash
# Encrypted WARD queue E2E: device confirmations, encrypted leaves, discard,
# WM finalization, batch commits and rollback. See README.md beside this file.
set -euo pipefail

if [[ "${1:-}" == --help ]]; then
    echo 'TREZOR_FIRMWARE=/path/to/trezor-firmware ./ward-queue.sh [pytest options]'
    exit 0
fi
source "$(dirname "${BASH_SOURCE[0]}")/ward-common.sh"
ward_run \
    tests/device_tests/misc/test_ward.py \
    tests/device_tests/misc/test_ward_batch.py \
    --deselect=tests/device_tests/misc/test_ward.py::test_ward_get_address_label \
    "$@"
