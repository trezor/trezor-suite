#!/usr/bin/env bash
#
# Full feedback-loop demo: fund a fresh "device" account on the private regtest chain and
# verify it receives the funds — fund -> scan -> assert — in seconds, deterministically.
#
# This is the loop that replaces [edit -> 15-min desktop build -> manual hardware send ->
# mainnet]. Here the device account is scanned by a second monero-wallet-rpc instance (it
# accepts the regtest chain via --allow-mismatched-daemon-version). In the real Suite E2E the
# device account is the Trezor account scanned by the blockchain-link worker instead — see
# README.md -> "Known limitation: monero-ts scan" for why the worker can't yet scan regtest
# directly, and how the connect SEND path is tested regardless.
#
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(dirname "$HERE")"
BIN="${MONERO_BIN_DIR:-$ROOT/bin}"
DATA="${MONERO_DATA_DIR:-$ROOT/data}"
DAEMON="127.0.0.1:${MONERO_RPC_PORT:-18381}"
DEV_PORT="${DEVICE_WALLET_RPC_PORT:-18384}"
DEV_URL="http://127.0.0.1:$DEV_PORT"
AMOUNT="${1:-500000000000}" # 0.5 XMR

wrpc() { curl -s -m 60 "$DEV_URL/json_rpc" -H 'Content-Type: application/json' \
    -d "{\"jsonrpc\":\"2.0\",\"id\":\"0\",\"method\":\"$1\",\"params\":${2:-{}}}"; }
jget() { python3 -c "import json,sys
try: print(json.load(sys.stdin)$1)
except Exception: print('')"; }

# 1. make sure the chain + funding wallet are up
"$ROOT/control.sh" up >/dev/null

# 2. a fresh device-account wallet in its own monero-wallet-rpc (stands in for the Trezor account)
mkdir -p "$DATA/device-wallets"
if ! pgrep -f "monero-wallet-rpc.*--rpc-bind-port $DEV_PORT" >/dev/null 2>&1; then
  "$BIN/monero-wallet-rpc" --daemon-address "$DAEMON" --trusted-daemon --allow-mismatched-daemon-version \
    --wallet-dir "$DATA/device-wallets" --rpc-bind-ip 127.0.0.1 --rpc-bind-port "$DEV_PORT" \
    --disable-rpc-login --non-interactive --log-level 0 >"$DATA/device-rpc.log" 2>&1 &
  for _ in $(seq 1 30); do wrpc get_version | grep -q '"id"' && break; sleep 1; done
fi
# A fresh wallet per run ($$ = PID) so the asserted balance is exactly this run's funding, not an
# accumulation from a previous run's persisted wallet.
WNAME="device-$$"
wrpc create_wallet "{\"filename\":\"$WNAME\",\"password\":\"\",\"language\":\"English\"}" >/dev/null
DEV_ADDR="$(wrpc get_address '{"account_index":0}' | jget "['result']['address']")"
echo "device account: ${DEV_ADDR:0:16}..."

# 3. fund it through the harness (deterministic, instant)
"$ROOT/control.sh" fund "$DEV_ADDR" "$AMOUNT"

# 4. scan + assert
wrpc refresh '{}' >/dev/null
BAL="$(wrpc get_balance '{"account_index":0}' | jget "['result']['balance']")"
echo "device scanned balance=$BAL  expected=$AMOUNT"
if [ "$BAL" = "$AMOUNT" ]; then echo "PASS ✓ fund + scan + assert in one fast loop"; exit 0
else echo "FAIL ✗"; exit 1; fi
