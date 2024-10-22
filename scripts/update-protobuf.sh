#!/usr/bin/env bash

# Set FROM_FW_BRANCH to the first argument or default to 'main' if no argument is provided
FROM_FW_BRANCH=${1:-main}

yarn workspace @trezor/protobuf update:protobuf "$FROM_FW_BRANCH"
yarn workspace @trezor/protobuf update:schema