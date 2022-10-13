#!/usr/bin/env bash
set -e

BINARY_NAME=WalletWasabi.WabiSabiClientLibrary

# TODO: this file should download the binaries from https://github.com/trezor/coinjoin-backend
# once those files are available in releases.
# For now we include unzip, copying to right directory and chmod files that require it.

7z x -y CoinjoinClientLibrary-binary.zip

# Re-naming direcotry from osx to mac to match the naming using in all the processes.
mv osx-arm64/ mac-arm64/
mv osx-x64/ mac-x64/

for p in linux-x64 linux-arm64 mac-x64 mac-arm64 win-x64; do
    cp -r ${p}/publish/* ${p}/
    rm -rf ${p}/publish
done

rm CoinjoinClientLibrary-binary.zip

chmod +x linux-x64/${BINARY_NAME} mac-arm64/${BINARY_NAME} mac-x64/${BINARY_NAME}
