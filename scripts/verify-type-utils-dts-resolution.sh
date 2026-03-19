#!/usr/bin/env sh

set -eu

echo "Running expected failure: yarn workspace @trezor/type-utils type-check"
if yarn workspace @trezor/type-utils type-check; then
    echo
    echo "Unexpected success: @trezor/type-utils type-check was expected to fail."
    exit 1
fi

echo
echo "Running expected success: yarn workspace @suite-common/dependency-injection type-check"
if ! yarn workspace @suite-common/dependency-injection type-check; then
    echo
    echo "Unexpected failure: @suite-common/dependency-injection type-check should succeed once @trezor/type-utils declaration files are available."
    exit 1
fi

echo
echo "Verification passed."