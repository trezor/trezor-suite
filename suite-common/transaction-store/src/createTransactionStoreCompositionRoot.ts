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
 * account's history only once a query asks for it, keeps those accounts fresh when the app says
 * they changed (a new revision), and has no clock of its own.
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

    // What the app last said of each account; the first list after a start syncs every tracked
    // account, as they may have changed while the store was off.
    const revisions = new Map<string, string>();

    const transactionStore: TransactionStore = {
        setAccounts: accounts => {
            transactionRepository.replaceAccounts(accounts);
            const changedAccountKeys = accounts
                .filter(({ accountKey, revision }) => revisions.get(accountKey) !== revision)
                .map(({ accountKey }) => accountKey);
            revisions.clear();
            accounts.forEach(({ accountKey, revision }) => revisions.set(accountKey, revision));
            syncQueue.requestSync({
                // Only those something has asked for; the store ignores the rest.
                accountKeys: transactionRepository.selectTrackedAccountKeys(changedAccountKeys),
                mode: 'latest',
            });

            return Promise.resolve();
        },
        setKnownTokens: knownTokens => {
            knownTokens.forEach(transactionRepository.replaceKnownTokens);

            return Promise.resolve();
        },
        requestFullHistory: accountKey => {
            syncQueue.requestSync({ accountKeys: [accountKey], mode: 'full' });

            return Promise.resolve();
        },
        subscribeQuery: (query, onRows) => {
            // Lazy: asking for an account's rows is what downloads its history.
            syncQueue.requestSync({
                accountKeys: query.accountKeys.filter(
                    accountKey =>
                        !syncQueue.isSyncing(accountKey) &&
                        transactionRepository.selectSyncState(accountKey).lastSyncedAt === null,
                ),
                mode: 'latest',
            });

            return liveQueries.subscribe(query, onRows);
        },
        dispose: async () => {
            await syncQueue.close();
            liveQueries.dispose();
        },
    };

    return ok(transactionStore);
};
