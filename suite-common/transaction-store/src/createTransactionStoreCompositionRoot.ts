import { type Result, ok } from '@trezor/type-utils';

import { createTransactionRepository } from './repository/createTransactionRepository';
import {
    type MigrateTransactionStoreSchemaError,
    migrateTransactionStoreSchema,
} from './schema/migrateTransactionStoreSchema';
import type { TransactionSourceDep } from './source/transactionSource';
import type { TransactionStoreSqliteDep } from './sqlite/transactionStoreSqlite';
import { createSyncAccountTransactions } from './sync/createSyncAccountTransactions';
import { createSyncQueue } from './sync/createSyncQueue';
import type { TransactionStore } from './transactionStore';
import type { TransactionStoreEvent, TransactionStoreListener } from './transactionStoreTypes';
import { type StartInterval, createNetworkWatcher } from './watch/createNetworkWatcher';

/** What each platform entry provides: its SQLite, its backends and its timers. */
export type TransactionStoreCompositionRootDeps = TransactionStoreSqliteDep &
    TransactionSourceDep & {
        startInterval: StartInterval;
        now: () => number;
        maxConcurrentJobsPerNetwork: number;
        fallbackIntervalMs: number;
    };

/**
 * Starts the store: migrates the database and wires the engine. It then keeps the watched
 * networks fresh on its own until `dispose`.
 */
export const createTransactionStoreCompositionRoot = (
    deps: TransactionStoreCompositionRootDeps,
): Result<TransactionStore, MigrateTransactionStoreSchemaError> => {
    const migration = migrateTransactionStoreSchema(deps);

    if (!migration.success) {
        return migration;
    }

    const listeners = new Set<TransactionStoreListener>();
    const emit = (event: TransactionStoreEvent) => listeners.forEach(listener => listener(event));

    const transactionRepository = createTransactionRepository(deps);
    const syncAccountTransactions = createSyncAccountTransactions({
        transactionRepository,
        transactionSource: deps.transactionSource,
        now: deps.now,
        onTransactionsStored: accountKey =>
            emit({ type: 'transactionsChanged', accountKeys: [accountKey] }),
    });
    const syncQueue = createSyncQueue({
        syncAccountTransactions,
        transactionRepository,
        maxConcurrentJobsPerNetwork: deps.maxConcurrentJobsPerNetwork,
        onStatusChanged: status => emit({ type: 'syncStatusChanged', status }),
    });
    const networkWatcher = createNetworkWatcher({
        syncQueue,
        transactionRepository,
        transactionSource: deps.transactionSource,
        startInterval: deps.startInterval,
        fallbackIntervalMs: deps.fallbackIntervalMs,
    });

    const transactionStore: TransactionStore = {
        setAccounts: accounts => {
            const { addedAccountKeys, removedAccountKeys } =
                transactionRepository.replaceAccounts(accounts);
            const watchedNetworks = networkWatcher.getWatchedNetworks();

            if (removedAccountKeys.length > 0) {
                emit({ type: 'transactionsChanged', accountKeys: removedAccountKeys });
            }
            // The accounts already stored are kept fresh by blocks and the interval.
            syncQueue.requestSync({
                accountKeys: accounts
                    .filter(
                        ({ accountKey, symbol }) =>
                            addedAccountKeys.includes(accountKey) &&
                            watchedNetworks.includes(symbol),
                    )
                    .map(({ accountKey }) => accountKey),
                mode: 'latest',
            });

            return Promise.resolve();
        },
        removeAccounts: accountKeys => {
            transactionRepository.removeAccounts(accountKeys);
            emit({ type: 'transactionsChanged', accountKeys });

            return Promise.resolve();
        },
        watchNetworks: symbols => networkWatcher.watchNetworks(symbols),
        requestSync: params => Promise.resolve(syncQueue.requestSync(params)),
        getSyncStatus: accountKeys => Promise.resolve(accountKeys.map(syncQueue.getSyncStatus)),
        selectTransactions: params =>
            Promise.resolve(transactionRepository.selectTransactions(params)),
        countTransactions: filter =>
            Promise.resolve(transactionRepository.countTransactions(filter)),
        query: query => Promise.resolve(transactionRepository.selectRows(query)),
        subscribe: listener => {
            listeners.add(listener);

            return Promise.resolve(() => {
                listeners.delete(listener);
            });
        },
        whenIdle: () => syncQueue.whenIdle(),
        dispose: async () => {
            networkWatcher.unwatchAll();
            await syncQueue.close();
            listeners.clear();
        },
    };

    return ok(transactionStore);
};
