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
    "tsx": "^4.21.0",
    "typescript": "^5.8.3"
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

cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "esModuleInterop": true,
    "resolveJsonModule": true
  },
  "include": ["type-check.ts"]
}
EOF

cat > type-check.ts << 'EOF'
import TrezorConnect from '@trezor/connect';
import TrezorConnectWeb from '@trezor/connect-web';

// Exercise subpath-imported types from devDependencies inlined into d.ts.
// If any inline `import("@trezor/*/lib/...")` target is not resolvable
// (e.g. due to a missing exports-map entry in the producer package),
// tsc --noEmit would fail here, signalling a regression that the runtime
// smoke tests below cannot detect.
type ChangeLanguageParams = Parameters<typeof TrezorConnect.changeLanguage>[0];
type FirmwareUpdateParams = Parameters<typeof TrezorConnect.firmwareUpdate>[0];
type EthereumSignTypedDataParams = Parameters<typeof TrezorConnect.ethereumSignTypedData>[0];
type CardanoSignTransactionParams = Parameters<typeof TrezorConnect.cardanoSignTransaction>[0];

const _connect: typeof TrezorConnect = TrezorConnect;
const _connectWeb: typeof TrezorConnectWeb = TrezorConnectWeb;

// Force usage so TS does not discard the types above.
export type { ChangeLanguageParams, FirmwareUpdateParams, EthereumSignTypedDataParams, CardanoSignTransactionParams };
export { _connect, _connectWeb };
EOF

echo ""
echo "=== Type-checking consumer (tsc --noEmit) ==="
./node_modules/.bin/tsc --noEmit --project tsconfig.json

echo ""
echo "=== Testing CJS (node index.cjs) ==="
node index.cjs

echo ""
echo "=== Testing ESM with tsx (yarn tsx index.mjs) ==="
yarn tsx index.mjs

echo ""
echo "=== Testing ESM with node (node index.mjs) ==="
node index.mjs

echo ""
echo "All tests passed!"
