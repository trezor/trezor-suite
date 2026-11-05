#!/usr/bin/env bash

set -euxo pipefail

PARENT_PATH=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "$PARENT_PATH"
cd ../submodules/trezor-common
git pull origin master
commit=$(git rev-parse --short HEAD)
echo "$commit"
cd ../..
# Committing the path alone keeps any other staged changes out of the bump commit.
git commit -m "chore(trezor-common): update trezor-common ($commit)" -- submodules/trezor-common
git submodule update --init --recursive
