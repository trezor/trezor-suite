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

/** What each platform entry provides: its SQLite and its backends. */
export type TransactionStoreCompositionRootDeps = TransactionStoreSqliteDep &
    TransactionSourceDep & {
        now: () => number;
        maxConcurrentJobsPerNetwork: number;
    };

/**
 * Starts the store: migrates the database and wires the engine. It syncs when asked to
 * (`requestSync`, and new accounts on `setAccounts`), not on a clock of its own: the app already
 * refreshes its accounts and tells the store when one changed, so there is one cadence for both.
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

    const transactionStore: TransactionStore = {
        setAccounts: accounts => {
            const { addedAccountKeys, removedAccountKeys } =
                transactionRepository.replaceAccounts(accounts);

            if (removedAccountKeys.length > 0) {
                emit({ type: 'transactionsChanged', accountKeys: removedAccountKeys });
            }
            // The accounts already stored are synced when the app sees them change.
            syncQueue.requestSync({ accountKeys: addedAccountKeys, mode: 'latest' });

            return Promise.resolve();
        },
        removeAccounts: accountKeys => {
            transactionRepository.removeAccounts(accountKeys);
            emit({ type: 'transactionsChanged', accountKeys });

            return Promise.resolve();
        },
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
            await syncQueue.close();
            listeners.clear();
        },
    };

    return ok(transactionStore);
};
