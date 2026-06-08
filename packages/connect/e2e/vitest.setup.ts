import { vi } from 'vitest';

// Load TX cache data: Node reads JSON files at runtime via fs,
// browser uses a pre-built virtual module (see txCachePlugin in vitest.config.ts).
const CACHE: Record<string, unknown> =
    typeof window === 'undefined'
        ? (await import('./__txcache__/index.js')).CACHE
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
        }>('./__wscache__/index.js');

        return { default: transformCoinsJson(json) };
    });
}
