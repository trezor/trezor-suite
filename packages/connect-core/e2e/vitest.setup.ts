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

// Mock coins.json for WS cache mode in Node.
// Browser handles this via wsCacheTransformPlugin in vitest.config.ts.
if (typeof window === 'undefined' && process.env.TESTS_USE_WS_CACHE === 'true') {
    vi.doMock('../../connect-data/files/coins.json', async () => {
        const mod = await vi.importActual<Record<string, unknown>>(
            '../../connect-data/files/coins.json',
        );
        const json = 'default' in mod ? mod.default : mod;
        const { transformCoinsJson } = await vi.importActual<{
            transformCoinsJson: (json: unknown) => unknown;
        }>('./__wscache__/index.js');

        return { default: transformCoinsJson(json) };
    });
}
