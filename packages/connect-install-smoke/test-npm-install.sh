#!/usr/bin/env bash

# Validate that installing @trezor/connect* from the npm registry works for
# each consumer shape covered by fixtures/.

set -e

PACKAGE_VERSION="${1:?package version (e.g. 9.7.3 or "latest") required as first argument}"
export PACKAGE_VERSION

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/helpers.sh"

TEST_ROOT="$(mktemp -d -t connect-install-smoke-npm.XXXXXX)"
trap 'rm -rf "$TEST_ROOT"' EXIT

cd "$TEST_ROOT"
npm --version
node --version

run_install_smoke connect registry-npm runtime
run_install_smoke connect-web registry-npm runtime
run_install_smoke connect-mobile registry-npm runtime
# @trezor/connect-webextension is skipped for registry scenarios: the published
# v9 line ships a browser webpack bundle that references `self` at module top,
# which throws ReferenceError under plain Node. The package is still smoke-tested
# in the local scenario against the v10 ESM tarball built from develop.

echo ""
echo "All npm install-smoke fixtures passed."
