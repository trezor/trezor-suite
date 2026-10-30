/** Spawns the store's SQLite worker; here, so webpack bundles the worker entry with this package. */
export const createTransactionStoreWorker = () =>
    new Worker(
        new URL(
            /* webpackChunkName: "workers/transaction-store-sqlite-worker" */
            './sqlite/transactionStoreSqliteWorker',
            import.meta.url,
        ),
        { type: 'module' },
    );
