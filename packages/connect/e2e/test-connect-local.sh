#!/usr/bin/env bash

# Validate that installing local connect packages are working.

set -e

PACKED_PACKAGES_DIR="${1:-tmp/packed-packages}"

if [ ! -d "$PACKED_PACKAGES_DIR" ]; then
    echo "Error: Packed packages directory not found: $PACKED_PACKAGES_DIR"
    echo "Usage: $0 [path-to-packed-packages]"
    exit 1
fi

PACKED_PACKAGES_DIR="$(cd "$PACKED_PACKAGES_DIR" && pwd)"
echo "Using packed packages from: $PACKED_PACKAGES_DIR"

OVERRIDES_FILE="$PACKED_PACKAGES_DIR/overrides.json"
if [ ! -f "$OVERRIDES_FILE" ]; then
    echo "Error: overrides.json not found: $OVERRIDES_FILE"
    exit 1
fi

OVERRIDES_CONTENT=$(cat "$OVERRIDES_FILE")
CONNECT_PATH=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$OVERRIDES_FILE'))['@trezor/connect'])")
CONNECT_WEB_PATH=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$OVERRIDES_FILE'))['@trezor/connect-web'])")

trap "cd .. && rm -rf connect-implementation-local" EXIT

npm --version
node --version

mkdir ../connect-implementation-local
cd ../connect-implementation-local

cat > package.json << EOF
{
  "name": "connect-implementation-local",
  "version": "1.0.0",
  "description": "Test local @trezor/connect packages",
  "main": "index.js",
  "dependencies": {
    "@trezor/connect": "${CONNECT_PATH}",
    "@trezor/connect-web": "${CONNECT_WEB_PATH}",
    "tsx": "^4.21.0"
  },
  "overrides": ${OVERRIDES_CONTENT}
}
EOF

echo "Installing dependencies..."
npm install

cat package.json

cat > index.cjs << 'EOF'
const assert = require('assert');
const TrezorConnect = require('@trezor/connect').default;
const TrezorConnectWeb = require('@trezor/connect-web').default;

assert.ok(TrezorConnect, 'TrezorConnect should be defined');
assert.strictEqual(typeof TrezorConnect.init, 'function', 'TrezorConnect.init should be a function');

assert.ok(TrezorConnectWeb, 'TrezorConnectWeb should be defined');
assert.strictEqual(typeof TrezorConnectWeb.init, 'function', 'TrezorConnectWeb.init should be a function');

console.log('All CJS assertions passed.');
EOF

cat > index.mjs << 'EOF'
import assert from 'node:assert';
import TrezorConnect from '@trezor/connect';
import TrezorConnectWeb from '@trezor/connect-web';

assert.ok(TrezorConnect, 'TrezorConnect should be defined');
console.log('TrezorConnect:', TrezorConnect);
assert.strictEqual(typeof TrezorConnect.init, 'function', 'TrezorConnect.init should be a function');

assert.ok(TrezorConnectWeb, 'TrezorConnectWeb should be defined');
assert.strictEqual(typeof TrezorConnectWeb.init, 'function', 'TrezorConnectWeb.init should be a function');

console.log('All ESM assertions passed.');
EOF

echo ""
echo "=== Testing CJS (node index.cjs) ==="
node index.cjs

echo ""
echo "=== Testing ESM with tsx (npx tsx index.mjs) ==="
npx tsx index.mjs

echo ""
echo "=== Testing ESM with node (node index.mjs) ==="
node index.mjs

echo ""
echo "All tests passed!"
