#!/usr/bin/env bash
set -e

# Pinned version is older than June 2025, so SHA256 checksum digest is not available from Github API.
PINNED_VERSION="release/v15.0"
RELEASE_URL="https://github.com/trezor/WalletWasabi/releases/download/$PINNED_VERSION"
RELEASE_NAME="WabiSabiClientLibrary"

DIST="./files/bin/coinjoin"
DIST_NAME=WalletWasabi.WabiSabiClientLibrary

wget ${RELEASE_URL}/${RELEASE_NAME}-linux-arm64 -O ${DIST}/linux-arm64/${DIST_NAME}
wget ${RELEASE_URL}/${RELEASE_NAME}-linux-x64 -O ${DIST}/linux-x64/${DIST_NAME}
wget ${RELEASE_URL}/${RELEASE_NAME}-osx-arm64 -O ${DIST}/mac-arm64/${DIST_NAME}
wget ${RELEASE_URL}/${RELEASE_NAME}-osx-x64 -O ${DIST}/mac-x64/${DIST_NAME}
wget ${RELEASE_URL}/${RELEASE_NAME}-win-x64.exe -O ${DIST}/win-x64/${DIST_NAME}.exe

chmod +x ${DIST}/linux-x64/${DIST_NAME} ${DIST}/mac-arm64/${DIST_NAME} ${DIST}/mac-x64/${DIST_NAME}
