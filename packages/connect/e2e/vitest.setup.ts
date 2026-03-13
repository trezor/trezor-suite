import { vi } from 'vitest';

declare let globalThis: {
    TestUtils: {
        TX_CACHE: (txs: string[], force?: boolean) => unknown[];
    };
};

if (typeof window === 'undefined') {
    // Node environment — use fs-based __txcache__
    const { TX_CACHE } = require('./__txcache__');

    globalThis.TestUtils = {
        ...globalThis.TestUtils,
        TX_CACHE,
    };

    // Mock coins.json for WS cache mode in Node
    if (process.env.TESTS_USE_WS_CACHE === 'true') {
        vi.mock('../../connect-data/files/coins.json', async () => {
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
} else {
    // Browser environment — use virtual module that was pre-built by the txCachePlugin
    // The CACHE is injected via the Vite plugin (virtual:txcache) at build time.
    // We import it dynamically here.
    const { CACHE } = await import('virtual:txcache');
    const { TESTS_USE_TX_CACHE } = process.env;

    globalThis.TestUtils = {
        ...globalThis.TestUtils,
        TX_CACHE: (txs: string[], force = false) => {
            if (TESTS_USE_TX_CACHE === 'false' && !force) return [];

            return txs.map((hash: string) => {
                if (!(CACHE as Record<string, unknown>)[hash]) {
                    throw Error(`TX_CACHE for ${hash} is undefined`);
                }

                return (CACHE as Record<string, unknown>)[hash];
            });
        },
    };
    // WS cache transform for browser is handled by the wsCacheTransformPlugin in vitest.config.ts
}
