import assert from 'node:assert';
import TrezorConnectMobile, { DEVICE_EVENT, TrezorConnectDeeplink } from '@trezor/connect-mobile';

// Runtime smoke: load + default-export truthy + runtime named exports.
// `.init` is asserted via type-check.ts in the local scenario; we skip it
// here because registry scenarios install the published v9 line (CJS) where
// `import X from 'cjs-pkg'` resolves X to the module.exports wrapper and
// `X.init` would be undefined.
assert.ok(TrezorConnectMobile, 'TrezorConnectMobile default export should be defined');
assert.strictEqual(typeof DEVICE_EVENT, 'string', 'DEVICE_EVENT should be exported as string');
assert.strictEqual(
    typeof TrezorConnectDeeplink,
    'function',
    'TrezorConnectDeeplink class should be exported',
);

console.log('@trezor/connect-mobile ESM runtime: OK (DEVICE_EVENT =', DEVICE_EVENT, ')');
