#!/usr/bin/env bash
set -euo pipefail

# Copy C++ sources and codegen spec from @emurgo/csl-mobile-bridge into the package.
# CocoaPods dev-pods require source_files inside the pod root.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PACKAGE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
CSL_BRIDGE_DIR=$(node --print "require.resolve('@emurgo/csl-mobile-bridge/package.json').replace('/package.json', '')")

mkdir -p "$PACKAGE_DIR/ios/csl_cpp" "$PACKAGE_DIR/ios/csl_ios" "$PACKAGE_DIR/vendor/csl-mobile-bridge/src"

cp "$CSL_BRIDGE_DIR/cpp/NativeCslMobileBridgeModule.cpp" "$PACKAGE_DIR/ios/csl_cpp/"
cp "$CSL_BRIDGE_DIR/cpp/NativeCslMobileBridgeModule.h"   "$PACKAGE_DIR/ios/csl_cpp/"
cp "$CSL_BRIDGE_DIR/ios/CslMobileBridgeOnLoad.mm"         "$PACKAGE_DIR/ios/csl_ios/"
cp "$CSL_BRIDGE_DIR/src/NativeCslMobileBridge.ts"          "$PACKAGE_DIR/vendor/csl-mobile-bridge/src/"
