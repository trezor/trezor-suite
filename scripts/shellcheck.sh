#!/usr/bin/env bash

set -e
set -u
set -x
set -o pipefail

shellcheck --version
# lint all *.sh files
find . -type f -name '*.sh' ! -path './node_modules/*' ! -path './yarn/*' ! -path './suite-native/app/ios/*' ! -path './submodules/*' -print0 | xargs -0 shellcheck
