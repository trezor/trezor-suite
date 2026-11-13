import { vi } from 'vitest';

// Ensure process.nextTick is available in browser.
// vite-plugin-node-polyfills provides it but uses a conditional guard
// (globalThis.process = globalThis.process || polyfill) which is a no-op
// when Vitest already sets a partial process object. The cbor package
// (used by cardanoSignMessage) depends on Node.js streams that call process.nextTick.
if (typeof process !== 'undefined' && typeof process.nextTick !== 'function') {
    process.nextTick = (fn: (...a: unknown[]) => void, ...args: unknown[]) => {
        queueMicrotask(() => fn(...args));
    };
}

// Use the bundled firmware release config instead of fetching it from data.trezor.io on every init.
vi.mock(import('../src/data/firmwareInfo'), async importOriginal => ({
    ...(await importOriginal()),
    getRemoteFirmwareConfig: () => Promise.resolve(null),
}));
