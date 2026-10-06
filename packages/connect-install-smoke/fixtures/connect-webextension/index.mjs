import assert from 'node:assert';

// connect-webextension calls initProxyChannel() at module top-level, which
// touches chrome.runtime.onConnect.addListener. Stub the entire chrome
// global with a recursive proxy so the module can load under plain Node
// without a browser environment.
const chromeStub = new Proxy(function () {}, {
    get() {
        return chromeStub;
    },
    apply() {
        return chromeStub;
    },
    construct() {
        return chromeStub;
    },
});
globalThis.chrome = chromeStub;

// Dynamic import so the chrome stub above is in place before the module's
// top-level initProxyChannel() runs (static imports are hoisted past the
// stub assignment).
const TrezorConnectWebextModule = await import('@trezor/connect-webextension');

// Runtime smoke: load + default-export truthy. `.init` is asserted via
// the local scenario's tarball-built v10 package; registry scenarios install
// the published v9 line (CJS) where the ESM default-import path returns the
// module.exports wrapper and `.init` would be undefined.
const TrezorConnectWebext = TrezorConnectWebextModule.default;
assert.ok(TrezorConnectWebext, 'TrezorConnectWebext default export should be defined');

console.log(
    '@trezor/connect-webextension ESM runtime: OK (typeof =',
    typeof TrezorConnectWebext,
    ')',
);
