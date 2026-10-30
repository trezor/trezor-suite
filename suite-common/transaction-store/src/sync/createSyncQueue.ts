import type { TransactionRepositoryDep } from '../repository/createTransactionRepository';
import type { SyncMode } from '../transactionStoreTypes';
import type { SyncAccountTransactionsDep } from './createSyncAccountTransactions';

export type SyncQueueDeps = SyncAccountTransactionsDep & TransactionRepositoryDep;

export type SyncQueue = {
    /**
     * Starts the syncs in the background; resolves once each new one is marked as syncing, so a
     * reader after it sees the account as syncing.
     */
    requestSync: (params: { accountKeys: string[]; mode: SyncMode }) => Promise<void>;
    isSyncing: (accountKey: string) => boolean;
    /** Takes no more requests and resolves once the running syncs are done. */
    close: () => Promise<void>;
};

export type SyncQueueDep = { syncQueue: SyncQueue };

const mergeModes = (a: SyncMode | undefined, b: SyncMode): SyncMode =>
    a === 'full' || b === 'full' ? 'full' : 'latest';

/**
 * One sync per account at a time. Only accounts someone opened are synced, so there are few at
 * once and nothing needs to wait for a slot.
 */
export const createSyncQueue = (deps: SyncQueueDeps): SyncQueue => {
    const running = new Map<string, Promise<void>>();
    // Asked for while the account's sync ran, which may have fetched its page before the change.
    const reruns = new Map<string, SyncMode>();
    let isClosed = false;

    const takeRerun = (accountKey: string) => {
        const mode = reruns.get(accountKey);
        reruns.delete(accountKey);

        return mode;
    };

    const runSyncs = async (accountKey: string, mode: SyncMode) => {
        for (
            let nextMode: SyncMode | undefined = mode;
            nextMode !== undefined;
            nextMode = takeRerun(accountKey)
        ) {
            await deps.syncAccountTransactions({ accountKey, mode: nextMode });
        }
    };

    /** Marked as syncing in the database, so the app reads it with the rest of its state. */
    const runAccount = async (accountKey: string, mode: SyncMode, onStarted: () => void) => {
        // Only stored accounts can be synced, or have a sync state.
        if ((await deps.transactionRepository.selectAccount(accountKey)) === undefined) return;

        await deps.transactionRepository.setSyncing({ accountKey, isSyncing: true });
        onStarted();
        try {
            await runSyncs(accountKey, mode);
        } finally {
            // The account may have been removed meanwhile; then there is nothing to clear.
            if ((await deps.transactionRepository.selectAccount(accountKey)) !== undefined) {
                await deps.transactionRepository.setSyncing({ accountKey, isSyncing: false });
            }
        }
    };

    return {
        requestSync: async ({ accountKeys, mode }) => {
            if (isClosed) return;

            const starts = accountKeys.map(accountKey => {
                if (running.has(accountKey)) {
                    reruns.set(accountKey, mergeModes(reruns.get(accountKey), mode));

                    return Promise.resolve();
                }

                return new Promise<void>(onStarted => {
                    const run = runAccount(accountKey, mode, onStarted)
                        // An unexpected failure (the database, not the backend) must not leave
                        // the account stuck as syncing; the next request retries it.
                        .catch(() => {})
                        .finally(() => {
                            running.delete(accountKey);
                            // Never started (not stored, or the database failed): nothing waits.
                            onStarted();
                        });
                    running.set(accountKey, run);
                });
            });
            await Promise.all(starts);
        },

        isSyncing: accountKey => running.has(accountKey),

        close: async () => {
            isClosed = true;
            reruns.clear();
            await Promise.all(running.values());
        },
    };
};
