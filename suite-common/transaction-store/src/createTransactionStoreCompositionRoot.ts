import { createLiveQueries } from './query/createLiveQueries';
import { createTransactionRepository } from './repository/createTransactionRepository';
import { migrateTransactionStoreSchema } from './schema/migrateTransactionStoreSchema';
import type { TransactionSourceDep } from './source/transactionSource';
import type { TransactionStoreSqliteDep } from './sqlite/transactionStoreSqlite';
import { createSyncAccountTransactions } from './sync/createSyncAccountTransactions';
import { createSyncQueue } from './sync/createSyncQueue';
import type { TransactionStore } from './transactionStore';
import type { Unsubscribe } from './transactionStoreTypes';

export type TransactionStoreStartFailure = 'DatabaseUnavailable' | 'SchemaFromNewerVersion';

/** What each platform entry provides: its SQLite and its source of history. */
export type TransactionStoreCompositionRootDeps = TransactionStoreSqliteDep &
    TransactionSourceDep & {
        now: () => number;
        /** The store then does nothing; the rest of the app runs as before. */
        onStartFailed: (reason: TransactionStoreStartFailure) => void;
    };

/**
 * The store, starting: it migrates the database first, and every call waits for that. It is
 * lazy: it downloads an account's history only once a query asks for it, keeps those accounts
 * fresh when the app says they changed (a new revision), and has no clock of its own.
 */
export const createTransactionStoreCompositionRoot = (
    deps: TransactionStoreCompositionRootDeps,
): TransactionStore => {
    const liveQueries = createLiveQueries(deps);
    const transactionRepository = createTransactionRepository({
        sqlite: deps.sqlite,
        onWritten: liveQueries.invalidate,
    });
    const syncAccountTransactions = createSyncAccountTransactions({
        transactionRepository,
        transactionSource: deps.transactionSource,
        now: deps.now,
    });
    const syncQueue = createSyncQueue({ syncAccountTransactions, transactionRepository });

    /** Whether the store runs; every call waits for it. */
    const isStarted = migrateTransactionStoreSchema(deps)
        .then(async migration => {
            if (!migration.success) {
                deps.onStartFailed(migration.error.type);

                return false;
            }
            await transactionRepository.clearSyncing();

            return true;
        })
        .catch(() => {
            deps.onStartFailed('DatabaseUnavailable');

            return false;
        });
    const whenStarted = (run: () => Promise<void> | void) =>
        isStarted.then(async isRunning => {
            if (isRunning) await run();
        });

    // What the app last said of each account; the first list after a start syncs every tracked
    // account, as they may have changed while the store was off.
    const revisions = new Map<string, string>();

    return {
        setAccounts: accounts =>
            whenStarted(async () => {
                await transactionRepository.replaceAccounts(accounts);
                const changedAccountKeys = accounts
                    .filter(({ accountKey, revision }) => revisions.get(accountKey) !== revision)
                    .map(({ accountKey }) => accountKey);
                revisions.clear();
                accounts.forEach(({ accountKey, revision }) => revisions.set(accountKey, revision));
                syncQueue.requestSync({
                    // Only those something has asked for; the store ignores the rest.
                    accountKeys:
                        await transactionRepository.selectTrackedAccountKeys(changedAccountKeys),
                    mode: 'latest',
                });
            }),

        setKnownTokens: knownTokens =>
            whenStarted(async () => {
                await Promise.all(knownTokens.map(transactionRepository.replaceKnownTokens));
            }),

        requestFullHistory: accountKey =>
            whenStarted(() => syncQueue.requestSync({ accountKeys: [accountKey], mode: 'full' })),

        subscribeQuery: (query, onRows) => {
            let unsubscribe: Unsubscribe | null = null;
            let isSubscribed = true;

            void whenStarted(async () => {
                if (!isSubscribed) return;

                unsubscribe = liveQueries.subscribe(query, onRows);
                // Lazy: asking for an account's rows is what downloads its history.
                const syncStates = await Promise.all(
                    query.accountKeys.map(transactionRepository.selectSyncState),
                );
                syncQueue.requestSync({
                    accountKeys: query.accountKeys.filter(
                        (accountKey, index) =>
                            !syncQueue.isSyncing(accountKey) &&
                            syncStates[index]?.lastSyncedAt === null,
                    ),
                    mode: 'latest',
                });
            });

            return () => {
                isSubscribed = false;
                unsubscribe?.();
            };
        },

        dispose: async () => {
            await isStarted;
            await syncQueue.close();
            liveQueries.dispose();
        },
    };
};
