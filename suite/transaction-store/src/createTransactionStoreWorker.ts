/** Spawns the store's worker; here, so webpack bundles the worker entry with this package. */
export const createTransactionStoreWorker = () =>
    new Worker(
        new URL(
            /* webpackChunkName: "workers/transaction-store-worker" */
            './worker/transactionStoreWorker',
            import.meta.url,
        ),
        { type: 'module' },
    );
