#!/usr/bin/env bash
set -e

# TODO: run docker build

cp ./target/x86_64-apple-darwin/release/trezor-ble ./bin/macos/trezor-ble
cp ./target/x86_64-unknown-linux-musl/release/trezor-ble ./bin/linux/trezor-ble
cp ./target/x86_64-pc-windows-gnu/release/trezor-ble.exe ./bin/windows/trezor-ble.exe
