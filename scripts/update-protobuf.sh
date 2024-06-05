#!/usr/bin/env bash

FROM_FW_BRANCH=$1

yarn workspace @trezor/protobuf update:protobuf "$FROM_FW_BRANCH"
yarn workspace @trezor/protobuf update:schema