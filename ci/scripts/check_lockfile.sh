#!/usr/bin/env bash

# This file exists because as of yarn@1.12.3, --frozen-lockfile is completely
# broken when combined with Yarn workspaces. See https://github.com/yarnpkg/yarn/issues/6291
set -euxo pipefail

CKSUM_BEFORE=$(cksum yarn.lock)
echo "checksum before $CKSUM_BEFORE"
yarn install --cache-folder .yarn --prefer-offline
CKSUM_AFTER=$(cksum yarn.lock)
echo "checksum after $CKSUM_AFTER"


if [[ "$CKSUM_BEFORE" != "$CKSUM_AFTER" ]]; then
  echo "check-lockfile.sh: yarn.lock was modified unexpectedly - terminating"
  exit 1
fi
