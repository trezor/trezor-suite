#!/usr/bin/env bash

# Starts the emulated Bluetooth stack and the trezor-bluetooth websocket server:
#   dbus-daemon -> bluetoothd -> mock_trezor.py (virtual controller + Trezor peripheral) -> trezor-bluetooth

set -euo pipefail

BIN="${TREZOR_BLUETOOTH_BIN:-/opt/trezor-bluetooth/trezor-bluetooth}"
READY_FILE="${MOCK_READY_FILE:-/tmp/mock_trezor.ready}"
export MOCK_READY_FILE="$READY_FILE"

fail() {
  echo "ERROR: $*" >&2
  exit 1
}

wait_for() {
  local description=$1 attempts=$2
  shift 2
  for _ in $(seq "$attempts"); do
    if "$@" >/dev/null 2>&1; then
      return 0
    fi
    sleep 0.5
  done
  fail "timeout waiting for ${description}"
}

list_adapters() {
  find /sys/class/bluetooth -maxdepth 1 -name 'hci[0-9]*' -printf '%f\n' 2>/dev/null | sort
}

new_adapter() {
  comm -13 <(echo "$ADAPTERS_BEFORE") <(list_adapters) | head -n 1
}

has_new_adapter() {
  [ -n "$(new_adapter)" ]
}

[ -x "$BIN" ] || fail "trezor-bluetooth binary not found at ${BIN}"
[ -c /dev/vhci ] || fail "/dev/vhci is missing. Run on the host: sudo modprobe hci_vhci"

# HCI devices are shared with the host kernel. trezor-bluetooth uses the first adapter reported by BlueZ,
# so any other adapter would make the test run non-deterministic.
ADAPTERS_BEFORE="$(list_adapters)"
if [ -n "$ADAPTERS_BEFORE" ] && [ "${E2E_ALLOW_FOREIGN_ADAPTERS:-0}" != "1" ]; then
  fail "host already has Bluetooth adapter(s): $(echo "$ADAPTERS_BEFORE" | tr '\n' ' '). Disable them (e.g. sudo modprobe -r btusb) or set E2E_ALLOW_FOREIGN_ADAPTERS=1 (may be flaky)"
fi

mkdir -p /run/dbus
rm -f /run/dbus/pid
dbus-uuidgen --ensure
dbus-daemon --system --fork
wait_for "system dbus" 20 busctl --system status

/usr/libexec/bluetooth/bluetoothd -n &

rm -f "$READY_FILE"
/opt/venv/bin/python /opt/mock/ble_emulator.py &
MOCK_PID=$!

wait_for "mock Trezor" 60 test -e "$READY_FILE"
wait_for "virtual adapter" 20 has_new_adapter
ADAPTER="$(new_adapter)"
echo "$ADAPTER" >"${MOCK_CENTRAL_ADAPTER_FILE:-/tmp/mock_central_adapter}"
wait_for "bluez adapter object" 40 busctl --system get-property org.bluez "/org/bluez/${ADAPTER}" org.bluez.Adapter1 Address

# bluetoothd may keep the freshly created adapter powered off
wait_for "adapter power on" 20 busctl --system set-property org.bluez "/org/bluez/${ADAPTER}" org.bluez.Adapter1 Powered b true

kill -0 "$MOCK_PID" || fail "mock Trezor exited"

echo "Bluetooth emulation ready (${ADAPTER}), starting trezor-bluetooth"
exec "$BIN"
