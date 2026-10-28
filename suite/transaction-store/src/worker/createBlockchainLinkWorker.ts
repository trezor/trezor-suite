import type { BackendType } from '@suite-common/wallet-config';

/**
 * blockchain-link's backends as real workers, nested in the store's worker. Its in-thread module
 * variant cannot be used here: inside any worker it answers through `self.postMessage`, which
 * would go to the app and take over the store's messages.
 *
 * Solana, EVM RPC and Electrum have no worker build for the browser, so the store reports their
 * backend as unavailable for now.
 */
export const createBlockchainLinkWorker = (type: BackendType): (() => Worker) | undefined => {
    switch (type) {
        case 'blockbook':
            return () =>
                new Worker(
                    new URL(
                        /* webpackChunkName: "workers/transaction-store-blockbook-worker" */
                        '@trezor/blockchain-link/src/workers/blockbook',
                        import.meta.url,
                    ),
                    { type: 'module' },
                );
        case 'blockfrost':
            return () =>
                new Worker(
                    new URL(
                        /* webpackChunkName: "workers/transaction-store-blockfrost-worker" */
                        '@trezor/blockchain-link/src/workers/blockfrost',
                        import.meta.url,
                    ),
                    { type: 'module' },
                );
        case 'ripple':
            return () =>
                new Worker(
                    new URL(
                        /* webpackChunkName: "workers/transaction-store-ripple-worker" */
                        '@trezor/blockchain-link/src/workers/ripple',
                        import.meta.url,
                    ),
                    { type: 'module' },
                );
        case 'stellar':
            return () =>
                new Worker(
                    new URL(
                        /* webpackChunkName: "workers/transaction-store-stellar-worker" */
                        '@trezor/blockchain-link/src/workers/stellar',
                        import.meta.url,
                    ),
                    { type: 'module' },
                );
        default:
            return undefined;
    }
};
