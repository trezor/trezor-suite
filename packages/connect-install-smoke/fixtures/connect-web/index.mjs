import assert from 'node:assert';
import TrezorConnectWeb, { DEVICE_EVENT } from '@trezor/connect-web';

// Runtime smoke: load + default-export truthy + one runtime named export.
// `.init` is asserted via type-check.ts in the local scenario; we skip it
// here because registry scenarios install the published v9 line (CJS) where
// `import X from 'cjs-pkg'` resolves X to the module.exports wrapper and
// `X.init` would be undefined.
//
// DEVICE_EVENT is a runtime string constant exported by @trezor/connect-common,
// so the named-import path stays meaningful across both v9 and v10.
assert.ok(TrezorConnectWeb, 'TrezorConnectWeb default export should be defined');
assert.strictEqual(typeof DEVICE_EVENT, 'string', 'DEVICE_EVENT should be exported as string');

console.log('@trezor/connect-web ESM runtime: OK (DEVICE_EVENT =', DEVICE_EVENT, ')');
