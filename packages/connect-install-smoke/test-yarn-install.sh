#!/usr/bin/env bash

# Validate that installing @trezor/connect* from the npm registry via yarn
# works for each consumer shape covered by fixtures/.

set -e

PACKAGE_VERSION="${1:?package version (e.g. 9.7.3 or "latest") required as first argument}"
export PACKAGE_VERSION

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/helpers.sh"

TEST_ROOT="$(mktemp -d -t connect-install-smoke-yarn.XXXXXX)"
trap 'rm -rf "$TEST_ROOT"' EXIT

cd "$TEST_ROOT"
npm --version
node --version
yarn --version

# Registry scenarios test the latest published connect from npm, which is
# a different version line than `develop`. Skip the per-fixture type-check
# pass — it asserts on current-develop API surface that the published
# package may not yet expose. Runtime smoke is enough here: if the package
# is corrupt or its exports map is broken, node will fail to load it.
run_install_smoke connect registry-yarn runtime
run_install_smoke connect-web registry-yarn runtime
run_install_smoke connect-mobile registry-yarn runtime
# @trezor/connect-webextension is skipped for registry scenarios: the published
# v9 line ships a browser webpack bundle that references `self` at module top,
# which throws ReferenceError under plain Node. The package is still smoke-tested
# in the local scenario against the v10 ESM tarball built from develop.

echo ""
echo "All yarn install-smoke fixtures passed."
