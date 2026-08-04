#!/usr/bin/env bash
# Stages the platform Tor binary as a Tauri bundle resource (src-tauri/tor), so the built app
# carries its own Tor daemon like the Electron build. Mirrors the Electron bundling of
# suite-data/files/bin/tor/<platform>/tor. src/tor.rs resolve_tor_binary() prefers this resource.
#
# Requires git-lfs to have pulled the tor binaries (git lfs pull).
set -euo pipefail

PKG_DIR="$(cd "$(dirname "$0")/.." && pwd)"          # packages/suite-desktop-tauri
REPO="$(cd "$PKG_DIR/../.." && pwd)"                 # repo root
OUT="$PKG_DIR/src-tauri/tor"

uname_s="$(uname -s)"
uname_m="$(uname -m)"
case "$uname_m" in
    arm64 | aarch64) arch="arm64" ;;
    x86_64 | amd64) arch="x64" ;;
    *) echo "error: unsupported arch $uname_m" >&2; exit 1 ;;
esac
case "$uname_s" in
    Darwin) plat="mac-$arch"; exe="tor" ;;
    Linux) plat="linux-$arch"; exe="tor" ;;
    MINGW* | MSYS* | CYGWIN*) plat="win-x64"; exe="tor.exe" ;;
    *) echo "error: unsupported OS $uname_s" >&2; exit 1 ;;
esac

SRC="$REPO/packages/suite-data/files/bin/tor/$plat/$exe"
if [ ! -f "$SRC" ]; then
    echo "error: $SRC not found — run 'git lfs pull' first" >&2
    exit 1
fi

# Guard against an unresolved git-lfs pointer (a few hundred bytes of text).
if [ "$(wc -c < "$SRC")" -lt 100000 ]; then
    echo "error: $SRC looks like an unresolved git-lfs pointer — run 'git lfs pull'" >&2
    exit 1
fi

rm -rf "$OUT"
mkdir -p "$OUT"
cp "$SRC" "$OUT/$exe"
chmod +x "$OUT/$exe" 2>/dev/null || true

echo "assembled tor ($(du -sh "$OUT" | awk '{print $1}')): $plat/$exe"
