#!/usr/bin/env bash
# Stages the native trezor-bluetooth server binary as a Tauri bundle resource (src-tauri/bluetooth).
# The BLE management stack (BluetoothIpc + ipc-proxy) is now native Rust (src/bluetooth_host.rs), so
# there is no Node host to bundle — only this binary. src/bluetooth.rs resolve_binary() prefers it.
#
# Requires git-lfs to have pulled the binaries (git lfs pull).
set -euo pipefail

PKG_DIR="$(cd "$(dirname "$0")/.." && pwd)"          # packages/suite-desktop-tauri
REPO="$(cd "$PKG_DIR/../.." && pwd)"                 # repo root

uname_s="$(uname -s)"
uname_m="$(uname -m)"
case "$uname_m" in
    arm64 | aarch64) arch="arm64" ;;
    x86_64 | amd64) arch="x64" ;;
    *) echo "error: unsupported arch $uname_m" >&2; exit 1 ;;
esac
case "$uname_s" in
    Darwin) plat="mac-$arch"; exe="trezor-bluetooth" ;;
    Linux) plat="linux-$arch"; exe="trezor-bluetooth" ;;
    MINGW* | MSYS* | CYGWIN*) plat="win-x64"; exe="trezor-bluetooth.exe" ;;
    *) echo "error: unsupported OS $uname_s" >&2; exit 1 ;;
esac

SRC="$REPO/packages/suite-data/files/bin/bluetooth/$plat/$exe"
if [ ! -f "$SRC" ]; then
    echo "error: $SRC not found — run 'git lfs pull' first" >&2
    exit 1
fi
if [ "$(wc -c < "$SRC")" -lt 100000 ]; then
    echo "error: $SRC looks like an unresolved git-lfs pointer — run 'git lfs pull'" >&2
    exit 1
fi

OUT="$PKG_DIR/src-tauri/bluetooth"
rm -rf "$OUT"
mkdir -p "$OUT"
cp "$SRC" "$OUT/$exe"
chmod +x "$OUT/$exe" 2>/dev/null || true

echo "assembled bluetooth: $plat/$exe ($(du -h "$OUT/$exe" | awk '{print $1}'))"
