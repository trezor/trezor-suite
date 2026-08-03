import assert from 'node:assert';
import TrezorConnect from '@trezor/connect';

// Runtime smoke: load + default-export truthy. API-surface assertions live
// in type-check.ts (local scenario only); the registry scenarios import
// the published v9 line which is CJS, and `import X from 'cjs-pkg'` under
// ESM returns module.exports as a wrapper instead of the TrezorConnect
// instance itself — `.init` would be undefined and fail spuriously.
assert.ok(TrezorConnect, 'TrezorConnect default export should be defined');

console.log('@trezor/connect ESM runtime: OK (typeof =', typeof TrezorConnect, ')');
