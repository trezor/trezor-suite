#!/usr/bin/env bash

set -e -o pipefail

# TODO: how to run other unit tests?

set -x
cd packages/suite
yarn jest "$@"
