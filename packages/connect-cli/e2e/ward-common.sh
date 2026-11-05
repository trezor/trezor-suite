#!/usr/bin/env bash
# Shared runner for the encrypted WARD protocol. Source from an entry point below.
set -euo pipefail

ward_run() {
    local firmware="${TREZOR_FIRMWARE:-}" python suite report port executable cleanup
    suite="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
    if [[ -z "$firmware" && -n "${TREZOR_SRC:-}" ]]; then
        firmware="$(cd "$TREZOR_SRC/../.." && pwd)"
    fi
    if [[ -z "$firmware" || ! -f "$firmware/tests/ward_mgr_emu.py" ]]; then
        echo 'Set TREZOR_FIRMWARE to a ward-poc-encrypted firmware checkout.' >&2
        return 1
    fi
    firmware="$(cd "$firmware" && pwd)"
    python="${PYTHON:-$firmware/.venv/bin/python}"
    if [[ ! -x "$python" ]]; then
        echo "Python not found: $python. Run uv sync in the firmware checkout or set PYTHON." >&2
        return 1
    fi
    export PYTHONPATH="$firmware/python/src:$firmware${PYTHONPATH:+:$PYTHONPATH}"
    export WARDD_SUITE_DIR="$suite"
    cd "$firmware"
    # Other builds may move artifacts/latest while these tests are starting.
    executable="$firmware/core/build/artifacts/T3T1/firmware-emu"
    if [[ ! -x "$executable" ]]; then
        echo 'Build the Safe 5 emulator: uv run xtask build firmware --emulator -m T3T1 -p test-live' >&2
        return 1
    fi

    # Select a free block, including debuglink and the remaining emulator interfaces.
    # An explicitly requested port is checked too; never attach to another emulator.
    port="$("$python" - <<'PY'
import os
import secrets
import socket

requested = os.environ.get("TREZOR_UDP_PORT")
for _ in range(100):
    base = int(requested) if requested else 30008 + 8 * secrets.randbelow(4000)
    if not 30000 < base <= 65529:
        raise SystemExit("TREZOR_UDP_PORT must be between 30001 and 65529")
    sockets = []
    try:
        for port in range(base, base + 7):
            sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            sockets.append(sock)
            sock.bind(("127.0.0.1", port))
    except OSError:
        if requested:
            raise SystemExit(f"Emulator port block {base}..{base + 6} is busy")
    else:
        print(base)
        break
    finally:
        for sock in sockets:
            sock.close()
else:
    raise SystemExit("Could not find an available emulator port block")
PY
    )"
    report="$(mktemp -d "${TMPDIR:-/tmp}/ward-e2e.XXXXXXXX")"
    # emu.py owns its temporary profile and stops only the emulator it starts.
    printf -v cleanup 'rm -rf -- %q' "$report"
    trap "$cleanup" EXIT
    echo "Running encrypted WARD against a fresh headless emulator on UDP $port"
    "$python" core/emu.py --executable "$executable" -h -t -q -P "$port" -c \
        "$python" -m pytest -v --junitxml="$report/results.xml" "$@"
    # A missing dependency or wrong model must not produce a green, all-skipped run.
    "$python" - "$report/results.xml" <<'PY'
import sys
import xml.etree.ElementTree as ET

cases = list(ET.parse(sys.argv[1]).iter("testcase"))
if not cases or any(case.find("skipped") is not None for case in cases):
    raise SystemExit("WARD E2E requires executed tests; skipped cases are not a pass")
print(f"WARD E2E: {len(cases)} tests passed, none skipped")
PY
    rm -rf -- "$report"
    trap - EXIT
}
