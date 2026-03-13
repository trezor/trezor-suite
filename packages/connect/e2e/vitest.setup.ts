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

// Load TX cache data: Node reads JSON files at runtime via fs,
// browser uses a pre-built virtual module (see txCachePlugin in vitest.config.ts).
const CACHE: Record<string, unknown> =
    typeof window === 'undefined'
        ? (await import('./__txcache__')).CACHE
        : (await import('virtual:txcache')).CACHE;

globalThis.TestUtils = {
    ...globalThis.TestUtils,
    TX_CACHE: (txs: string[], force = false) => {
        if (process.env.TESTS_USE_TX_CACHE === 'false' && !force) return [];

        return txs.map((hash: string) => {
            if (!CACHE[hash]) {
                throw Error(`TX_CACHE for ${hash} is undefined`);
            }

            return CACHE[hash];
        });
    },
};

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
        }>('./__wscache__');

        return { default: transformCoinsJson(json) };
    });
}
