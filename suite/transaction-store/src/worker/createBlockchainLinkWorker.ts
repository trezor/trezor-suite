import type { BackendType } from '@suite-common/wallet-config';

/**
 * blockchain-link's backends as real workers, nested in the store's worker. Its in-thread module
 * variant cannot be used here: inside any worker it answers through `self.postMessage`, which
 * would go to the app and take over the store's messages.
 *
 * Electrum needs Node sockets and has no browser build at all, so it has none here: the store
 * fetches its pages through the app's Connect instead.
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
        // Connect runs these two in-thread in the browser, but both start themselves as workers
        // too (their `CONTEXT === 'worker'` branch), which is all a nested worker needs.
        case 'solana':
            return () =>
                new Worker(
                    new URL(
                        /* webpackChunkName: "workers/transaction-store-solana-worker" */
                        '@trezor/blockchain-link/src/workers/solana',
                        import.meta.url,
                    ),
                    { type: 'module' },
                );
        case 'evm-rpc':
            return () =>
                new Worker(
                    new URL(
                        /* webpackChunkName: "workers/transaction-store-evm-rpc-worker" */
                        '@trezor/blockchain-link/src/workers/evm-rpc',
                        import.meta.url,
                    ),
                    { type: 'module' },
                );
        default:
            return undefined;
    }
};
