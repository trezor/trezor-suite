#!/usr/bin/env bash
set -euo pipefail

npx madge --circular --extensions ts,tsx --exclude "node_modules|lib|libDev" packages suite suite-native suite-common
