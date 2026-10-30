import { type Result, ok } from '@trezor/type-utils';

import { createLiveQueries } from './query/createLiveQueries';
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

/** What each platform entry provides: its SQLite and its source of history. */
export type TransactionStoreCompositionRootDeps = TransactionStoreSqliteDep &
    TransactionSourceDep & {
        now: () => number;
    };

/**
 * Starts the store: migrates the database and wires the engine. It is lazy: it downloads an
 * account's history only once something asks for it (`ensureSynced`), keeps those accounts fresh
 * when the app says they changed (`refreshAccounts`), and has no clock of its own.
 */
export const createTransactionStoreCompositionRoot = (
    deps: TransactionStoreCompositionRootDeps,
): Result<TransactionStore, MigrateTransactionStoreSchemaError> => {
    const migration = migrateTransactionStoreSchema(deps);

    if (!migration.success) {
        return migration;
    }

    const liveQueries = createLiveQueries(deps);
    const transactionRepository = createTransactionRepository({
        sqlite: deps.sqlite,
        onWritten: liveQueries.invalidate,
    });
    transactionRepository.clearSyncing();
    const syncAccountTransactions = createSyncAccountTransactions({
        transactionRepository,
        transactionSource: deps.transactionSource,
        now: deps.now,
    });
    const syncQueue = createSyncQueue({ syncAccountTransactions, transactionRepository });

    const transactionStore: TransactionStore = {
        setAccounts: accounts => {
            transactionRepository.replaceAccounts(accounts);

            return Promise.resolve();
        },
        ensureSynced: async accountKeys => {
            syncQueue.requestSync({
                accountKeys: accountKeys.filter(
                    accountKey =>
                        !syncQueue.isSyncing(accountKey) &&
                        transactionRepository.selectSyncState(accountKey).lastSyncedAt === null,
                ),
                mode: 'latest',
            });
            await Promise.all(accountKeys.map(syncQueue.whenSettled));
        },
        refreshAccounts: accountKeys => {
            syncQueue.requestSync({
                accountKeys: transactionRepository.selectTrackedAccountKeys(accountKeys),
                mode: 'latest',
            });

            return Promise.resolve();
        },
        requestFullHistory: accountKey => {
            syncQueue.requestSync({ accountKeys: [accountKey], mode: 'full' });

            return Promise.resolve();
        },
        setKnownTokens: knownTokens => {
            knownTokens.forEach(transactionRepository.replaceKnownTokens);

            return Promise.resolve();
        },
        // A failing query rejects instead of throwing at the caller (or the RPC host).
        query: query => new Promise(resolve => resolve(liveQueries.run(query))),
        subscribeQuery: liveQueries.subscribe,
        dispose: async () => {
            await syncQueue.close();
            liveQueries.dispose();
        },
    };

    return ok(transactionStore);
};
