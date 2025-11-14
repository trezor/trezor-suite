import { inject, vi } from 'vitest';

// Always mock blockchain-link worker unless it's explicitly required not to.
if (process.env.TESTS_USE_WS_CACHE === 'true') {
    vi.mock('../../connect-common/files/coins.json', async () => {
        const json = await vi.importActual<any>('../../connect-common/files/coins.json');
        const { transformCoinsJson } = await vi.importActual<any>('./__wscache__');

        // json is a module with default export, get the actual data
        return { default: transformCoinsJson(json.default || json) };
    });
}

globalThis.TestUtils = {
    ...globalThis.TestUtils,
    TX_CACHE: (txs: string[], force = false) => {
        if (process.env.TESTS_USE_TX_CACHE === 'false' && !force) return [];

        const CACHE = inject('txCache');

        return txs.map(hash => {
            if (!CACHE[hash]) {
                throw Error(`TX_CACHE for ${hash} is undefined`);
            }

            return CACHE[hash];
        });
    },
};
