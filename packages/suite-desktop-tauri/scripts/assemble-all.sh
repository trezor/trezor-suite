#!/usr/bin/env bash
# Assembles ALL Tauri bundle resources (tor + bluetooth binary) in one shot.
#
# The bridge is now native Rust (no Node runtime), and the BLE host is native Rust too — the only
# bundled binaries are the tor daemon and the trezor-bluetooth server, both from git-lfs.
#
# `tauri build`/`tauri dev` hard-fails with an opaque "glob pattern did not match any files" error
# if the src-tauri/{tor,bluetooth} resource dirs (git-ignored, produced only at build time) are
# absent. Run this before building so all resource globs match.
#
# Prereq: git-lfs pulled (git lfs pull) for the tor + bluetooth binaries.
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"

bash "$DIR/assemble-tor.sh"
bash "$DIR/assemble-bluetooth.sh"

echo "all Tauri resources assembled"
