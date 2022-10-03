#!/usr/bin/env bash
set -e

# Fill in your path here:
BRIDGE_DIR="/Users/XXX/go/src/github.com/trezor/trezord-go"
BASE_DIR=$(dirname "$0")

make -C "${BRIDGE_DIR}" build-release

cp "${BRIDGE_DIR}/release/linux/build/trezord-linux-amd64" "${BASE_DIR}/linux-x64/trezord"
cp "${BRIDGE_DIR}/release/linux/build/trezord-linux-arm64" "${BASE_DIR}/linux-arm64/trezord"
cp "${BRIDGE_DIR}/release/windows/build/trezord-64b.exe" "${BASE_DIR}/win-x64/trezord.exe"
cp "${BRIDGE_DIR}/release/macos/build/trezord-arm64" "${BASE_DIR}/mac-arm64/trezord"
cp "${BRIDGE_DIR}/release/macos/build/trezord-amd64" "${BASE_DIR}/mac-x64/trezord"
