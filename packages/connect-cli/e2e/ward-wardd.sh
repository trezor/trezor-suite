#!/usr/bin/env bash
# Encrypted WARD over the real wardd WebSocket relay and firmware wire protocol.
set -euo pipefail

if [[ "${1:-}" == --help ]]; then
    echo 'TREZOR_FIRMWARE=/path/to/trezor-firmware ./ward-wardd.sh [pytest options]'
    exit 0
fi
source "$(dirname "${BASH_SOURCE[0]}")/ward-common.sh"
ward_run tests/device_tests/misc/test_ward_relay.py "$@"
