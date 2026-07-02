#!/usr/bin/env bash
#
# Fetch the monerod + monero-wallet-rpc binaries into ./bin for LOCAL use (the Docker
# image fetches them itself, see Dockerfile). Pinned to a known-good version — v0.18.1.1
# had a regtest regression (monero-project/monero#8600); anything >= 0.18.2 is clean.
#
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

MONERO_VERSION="${MONERO_VERSION:-v0.18.5.0}"

case "$(uname -s)-$(uname -m)" in
  Darwin-arm64) PLATFORM="mac-armv8" ;;
  Darwin-x86_64) PLATFORM="mac-x64" ;;
  Linux-x86_64) PLATFORM="linux-x64" ;;
  Linux-aarch64|Linux-arm64) PLATFORM="linux-armv8" ;;
  *) echo "unsupported platform $(uname -s)-$(uname -m)"; exit 1 ;;
esac

URL="https://downloads.getmonero.org/cli/monero-${PLATFORM}-${MONERO_VERSION}.tar.bz2"
mkdir -p "$HERE/bin"
cd "$HERE/bin"

if [ -x monerod ] && [ -x monero-wallet-rpc ]; then
  echo "binaries already present: $(./monerod --version 2>/dev/null)"
  exit 0
fi

echo "downloading $URL ..."
curl -fSL -o monero.tar.bz2 "$URL"
tar -xjf monero.tar.bz2
DIR="$(find . -maxdepth 1 -type d -name 'monero-*' | head -1)"
cp "$DIR/monerod" "$DIR/monero-wallet-rpc" .
chmod +x monerod monero-wallet-rpc
rm -rf "$DIR" monero.tar.bz2
echo "installed: $(./monerod --version)"
