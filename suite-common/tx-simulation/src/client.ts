import type { Blockaid } from '@blockaid/client';

let blockaidClientPromise: Promise<Blockaid> | null = null;

const createBlockaidClient = async () => {
    const { Blockaid: BlockaidClient } = await import('@blockaid/client');

    return new BlockaidClient({
        baseURL: 'https://cdn.trezor.io/dynamic/blockaid/',
        apiKey: '-', // placeholder, actually handled by proxy
        /**
         * Looked up per request instead of at construction time,
         * so creating the client never depends on a global fetch already being there
         * (jsdom test environments have none).
         */
        fetch: (...args) => globalThis.fetch(...args),
    });
};

/**
 * Loads the Blockaid SDK on the first dApp scan or transaction simulation instead of with the app.
 * A failed load is not cached, so the next call loads it again.
 */
export const getBlockaidClient = (): Promise<Blockaid> => {
    blockaidClientPromise ??= createBlockaidClient().catch(error => {
        blockaidClientPromise = null;
        throw error;
    });

    return blockaidClientPromise;
};
