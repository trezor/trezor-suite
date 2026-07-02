#!/usr/bin/env bash
#
# Container entrypoint (the analogue of trezor-user-env/docker/bitcoin-regtest/entrypoint.sh).
# Brings up the private Monero chain + funding wallet, bootstraps a spendable ring-16 chain,
# then stays in the foreground as PID 1 so the container keeps the daemons alive.
#
set -e
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# In the image the binaries are on PATH and the chain lives under /data; both overridable.
export MONERO_BIN_DIR="${MONERO_BIN_DIR:-/usr/local/bin}"
export MONERO_DATA_DIR="${MONERO_DATA_DIR:-/data}"
# Inside the isolated container we can use monerod's default ports (matches the Suite worker's
# hardcoded 127.0.0.1:18081); locally control.sh defaults to 18381 to avoid a mainnet clash.
export MONERO_RPC_PORT="${MONERO_RPC_PORT:-18081}"
export MONERO_P2P_PORT="${MONERO_P2P_PORT:-18080}"
export MONERO_ZMQ_PORT="${MONERO_ZMQ_PORT:-18082}"
export MONERO_WALLET_RPC_PORT="${MONERO_WALLET_RPC_PORT:-18083}"

"$HERE/control.sh" up

echo "monero-regtest ready; tailing daemon logs (container stop tears the chain down)"
exec tail -f "$MONERO_DATA_DIR/monerod.log" "$MONERO_DATA_DIR/wallet-rpc.log"
