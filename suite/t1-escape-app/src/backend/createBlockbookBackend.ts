import { BlockchainLink } from '@trezor/blockchain-link';
import { err, ok } from '@trezor/type-utils';

import type { Backend, BackendError } from './backend';
import { BLOCKBOOK_URLS } from '../bitcoin/bitcoinNetwork';

const toBackendError = (error: unknown): BackendError => ({
    type: 'backend',
    message: error instanceof Error ? error.message : 'Unknown backend error',
});

const settle = async <T>(request: Promise<T>) => {
    try {
        return ok(await request);
    } catch (error) {
        return err(toBackendError(error));
    }
};

export type BlockbookBackend = Backend & {
    dispose: () => void;
};

/**
 * Connects to Trezor's Bitcoin blockbook over WebSocket. The blockbook worker of
 * @trezor/blockchain-link is loaded as a plain module and runs in the main thread, so no
 * account data ever crosses a worker boundary.
 */
export const createBlockbookBackend = (): BlockbookBackend => {
    const link = new BlockchainLink({
        name: 'Bitcoin',
        worker: () =>
            import('@trezor/blockchain-link/src/workers/blockbook').then(module =>
                module.default(),
            ),
        server: BLOCKBOOK_URLS,
        debug: false,
    });

    return {
        getAccountInfo: params => settle(link.getAccountInfo(params)),
        getAccountUtxo: descriptor => settle(link.getAccountUtxo(descriptor)),
        getTransactionHex: txid => settle(link.getTransactionHex(txid)),
        pushTransaction: hex => settle(link.pushTransaction({ hex })),
        dispose: () => {
            link.dispose();
        },
    };
};
