#!/usr/bin/env bash
#
# Portable Monero regtest control for the Trezor Suite feedback-loop harness.
#
# Stands up a PRIVATE Monero chain (monerod --regtest) + a funding wallet
# (monero-wallet-rpc) and exposes the few operations a deterministic E2E loop needs:
# instant on-demand mining and funding an arbitrary address. The same private chain
# enforces the real consensus path — hard fork v16, ring size 16, RingCT
# BulletproofPlus + CLSAG — so a tx built + signed against it exercises the exact
# device/connect code path as mainnet, but instantly and reproducibly (no real coins,
# no real network, no ~2-minute blocks).
#
# This is the analogue of trezor-user-env/docker/bitcoin-regtest's entrypoint.sh:
# there bitcoind regtest is bootstrapped with `createwallet` + `-generate 150`; here
# monerod regtest is bootstrapped with a funding wallet + `generateblocks`. The
# commands below (status / mine / fund) map 1:1 to the future trezor-user-env WS
# handlers `monero-regtest-status` / `monero-generate-blocks` / `monero-fund-address`
# (see README.md → "Porting to trezor-user-env").
#
# Usage:
#   ./control.sh up            # start node + wallet-rpc, bootstrap a spendable chain
#   ./control.sh status        # height + funding balance
#   ./control.sh fund <addr> [piconero]   # send funds to <addr> + mine to confirm
#   ./control.sh mine [n] [addr]          # generate n blocks (decoys / confirmations)
#   ./control.sh down          # stop node + wallet-rpc
#
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# --- config (env-overridable; local defaults avoid clashing with a mainnet monerod
#     on 18081). In trezor-user-env's isolated container these can be the 18081 defaults. ---
MONERO_BIN_DIR="${MONERO_BIN_DIR:-$HERE/bin}"
MONERO_DATA_DIR="${MONERO_DATA_DIR:-$HERE/data}"
RPC_PORT="${MONERO_RPC_PORT:-18381}"
P2P_PORT="${MONERO_P2P_PORT:-18380}"
ZMQ_PORT="${MONERO_ZMQ_PORT:-18382}"
WALLET_RPC_PORT="${MONERO_WALLET_RPC_PORT:-18383}"
# >= 73 guarantees both the 60-block coinbase-maturity window and the >= 16 amount-0
# outputs a ring-16 spend draws its decoys from. Coinbase outputs ARE valid RingCT
# decoys, so mining alone seeds the ring — no special decoy step needed.
BOOTSTRAP_BLOCKS="${MONERO_BOOTSTRAP_BLOCKS:-80}"
# Fixed seed → deterministic funding address across teardowns (reproducible harness).
FUNDING_SEED="${MONERO_FUNDING_SEED:-aimless daily oven amused wonders love exhale hectare honked tirade hire abnormal fugitive sayings bluntly does reef younger godfather makeup oasis balding cupcake deepest deepest}"

MONEROD="$MONERO_BIN_DIR/monerod"
WALLET_RPC="$MONERO_BIN_DIR/monero-wallet-rpc"
DAEMON_RPC="http://127.0.0.1:$RPC_PORT"
WALLET_URL="http://127.0.0.1:$WALLET_RPC_PORT"

# --- tiny JSON-RPC helpers ---
drpc() { local p="${2:-}"; [ -z "$p" ] && p='{}'
  curl -s -m 30 "$DAEMON_RPC/json_rpc" -H 'Content-Type: application/json' \
    -d "{\"jsonrpc\":\"2.0\",\"id\":\"0\",\"method\":\"$1\",\"params\":$p}"; }
wrpc() { local p="${2:-}"; [ -z "$p" ] && p='{}'
  curl -s -m 90 "$WALLET_URL/json_rpc" -H 'Content-Type: application/json' \
    -d "{\"jsonrpc\":\"2.0\",\"id\":\"0\",\"method\":\"$1\",\"params\":$p}"; }
jget() { python3 -c "import json,sys
try:
  print(json.load(sys.stdin)$1)
except Exception:
  print('')"; }

require_bins() {
  [ -x "$MONEROD" ] || { echo "monerod not found at $MONEROD — run ./setup-local.sh (or set MONERO_BIN_DIR)"; exit 1; }
  [ -x "$WALLET_RPC" ] || { echo "monero-wallet-rpc not found at $WALLET_RPC — run ./setup-local.sh"; exit 1; }
}

wait_rpc() { # url label
  for _ in $(seq 1 40); do
    curl -s -m 3 "$1/json_rpc" -H 'Content-Type: application/json' \
      -d '{"jsonrpc":"2.0","id":"0","method":"get_version"}' 2>/dev/null | grep -q '"id"' && return 0
    sleep 1
  done
  echo "timeout waiting for $2 at $1" >&2; return 1
}

start_monerod() {
  if pgrep -f "monerod.*--rpc-bind-port $RPC_PORT" >/dev/null 2>&1; then return; fi
  mkdir -p "$MONERO_DATA_DIR/node"
  # --offline: no P2P; the chain is private. --fixed-difficulty 1: instant mining.
  # RPC clients (wallet-rpc, the Suite scan worker) talk to it over RPC regardless.
  "$MONEROD" --regtest --offline --fixed-difficulty 1 \
    --data-dir "$MONERO_DATA_DIR/node" \
    --rpc-bind-ip 127.0.0.1 --rpc-bind-port "$RPC_PORT" \
    --p2p-bind-port "$P2P_PORT" --zmq-rpc-bind-port "$ZMQ_PORT" \
    --no-igd --hide-my-port --non-interactive --log-level 0 \
    >"$MONERO_DATA_DIR/monerod.log" 2>&1 &
  wait_rpc "$DAEMON_RPC" monerod
}

start_wallet_rpc() {
  if pgrep -f "monero-wallet-rpc.*--rpc-bind-port $WALLET_RPC_PORT" >/dev/null 2>&1; then return; fi
  mkdir -p "$MONERO_DATA_DIR/wallets"
  # --allow-mismatched-daemon-version is REQUIRED for regtest: a fakechain reports HF v16 at
  # height 1, which a mainnet-nettype wallet otherwise rejects as "Unexpected hard fork version
  # v16 at height 1" (monero-project/monero#8600). The flag lets the wallet refresh anyway.
  "$WALLET_RPC" --daemon-address "127.0.0.1:$RPC_PORT" --trusted-daemon \
    --allow-mismatched-daemon-version \
    --wallet-dir "$MONERO_DATA_DIR/wallets" \
    --rpc-bind-ip 127.0.0.1 --rpc-bind-port "$WALLET_RPC_PORT" \
    --disable-rpc-login --non-interactive --log-level 0 \
    >"$MONERO_DATA_DIR/wallet-rpc.log" 2>&1 &
  wait_rpc "$WALLET_URL" monero-wallet-rpc
}

open_funding_wallet() {
  # Open the persisted funding wallet, or restore it deterministically from the seed.
  if wrpc open_wallet '{"filename":"funding","password":""}' | grep -q '"error"'; then
    wrpc restore_deterministic_wallet \
      "{\"filename\":\"funding\",\"password\":\"\",\"seed\":\"$FUNDING_SEED\",\"restore_height\":0}" >/dev/null
  fi
  wrpc refresh '{}' >/dev/null 2>&1 || true
}

funding_address() { wrpc get_address '{"account_index":0}' | jget "['result']['address']"; }

cmd_up() {
  require_bins
  start_monerod
  start_wallet_rpc
  open_funding_wallet
  local addr height
  addr="$(funding_address)"
  height="$(drpc get_info | jget "['result']['height']")"
  if [ "${height:-0}" -lt "$BOOTSTRAP_BLOCKS" ]; then
    echo "bootstrapping: mining $BOOTSTRAP_BLOCKS blocks (maturity + ring-16 decoys)..."
    drpc generateblocks "{\"amount_of_blocks\":$BOOTSTRAP_BLOCKS,\"wallet_address\":\"$addr\",\"starting_nonce\":0}" >/dev/null
  fi
  wrpc refresh '{}' >/dev/null 2>&1 || true
  cmd_status
}

cmd_status() {
  local height unlocked total
  height="$(drpc get_info | jget "['result']['height']")"
  unlocked="$(wrpc get_balance '{"account_index":0}' | jget "['result']['unlocked_balance']")"
  total="$(wrpc get_balance '{"account_index":0}' | jget "['result']['balance']")"
  echo "REGTEST READY  rpc=$DAEMON_RPC  height=${height:-?}  funding_unlocked=${unlocked:-?}  funding_total=${total:-?} (piconero)"
  echo "  funding_address=$(funding_address)"
}

cmd_mine() { # [n] [addr]
  local n="${1:-1}" addr="${2:-$(funding_address)}"
  drpc generateblocks "{\"amount_of_blocks\":$n,\"wallet_address\":\"$addr\",\"starting_nonce\":0}" >/dev/null
  wrpc refresh '{}' >/dev/null 2>&1 || true
  echo "mined $n block(s); height=$(drpc get_info | jget "['result']['height']")"
}

cmd_fund() { # <addr> [piconero]
  local addr="${1:?usage: fund <address> [piconero]}" amount="${2:-1000000000000}"
  wrpc refresh '{}' >/dev/null 2>&1 || true
  local res tx
  res="$(wrpc transfer "{\"destinations\":[{\"address\":\"$addr\",\"amount\":$amount}],\"account_index\":0,\"ring_size\":16,\"get_tx_key\":false}")"
  tx="$(echo "$res" | jget "['result']['tx_hash']")"
  if [ -z "$tx" ]; then echo "transfer failed: $(echo "$res" | jget "['error']")"; exit 1; fi
  cmd_mine 15 >/dev/null   # confirm (coinbase-free, 10-block unlock + headroom)
  echo "funded $addr  amount=$amount piconero  tx=$tx (confirmed)"
}

cmd_down() {
  pkill -f "monero-wallet-rpc.*--rpc-bind-port $WALLET_RPC_PORT" 2>/dev/null || true
  pkill -f "monerod.*--rpc-bind-port $RPC_PORT" 2>/dev/null || true
  # Wait for monerod to actually exit so it releases the LMDB lock; otherwise a quick `up`
  # afterwards fails to re-open the database.
  for _ in $(seq 1 20); do
    pgrep -f "monerod.*--rpc-bind-port $RPC_PORT" >/dev/null 2>&1 || break
    sleep 1
  done
  echo "stopped monerod + wallet-rpc (data kept in $MONERO_DATA_DIR)"
}

case "${1:-}" in
  up)     cmd_up ;;
  status) require_bins; cmd_status ;;
  mine)   require_bins; shift; cmd_mine "$@" ;;
  fund)   require_bins; shift; cmd_fund "$@" ;;
  down)   cmd_down ;;
  *) echo "usage: $0 {up|status|mine [n] [addr]|fund <addr> [piconero]|down}"; exit 1 ;;
esac
