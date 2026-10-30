import type { TransactionRepositoryDep } from '../repository/createTransactionRepository';
import type { SyncMode } from '../transactionStoreTypes';
import type { SyncAccountTransactionsDep } from './createSyncAccountTransactions';

export type SyncQueueDeps = SyncAccountTransactionsDep & TransactionRepositoryDep;

export type SyncQueue = {
    requestSync: (params: { accountKeys: string[]; mode: SyncMode }) => void;
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

    // In the database, so the app reads it with the rest of the account's state.
    const setSyncing = (accountKey: string, isSyncing: boolean) =>
        deps.transactionRepository.setSyncing({ accountKey, isSyncing });

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
            // An unexpected failure (the database, not the backend) must not leave the account
            // stuck as syncing; the next request retries it.
            await deps.syncAccountTransactions({ accountKey, mode: nextMode }).catch(() => {});
        }
    };

    return {
        requestSync: ({ accountKeys, mode }) => {
            if (isClosed) return;

            accountKeys.forEach(accountKey => {
                // Only stored accounts can be synced, or have a sync state.
                if (deps.transactionRepository.selectAccount(accountKey) === undefined) return;
                if (running.has(accountKey)) {
                    reruns.set(accountKey, mergeModes(reruns.get(accountKey), mode));

                    return;
                }

                setSyncing(accountKey, true);
                const run = runSyncs(accountKey, mode).finally(() => {
                    running.delete(accountKey);
                    // The account may have been removed meanwhile; then there is nothing to clear.
                    if (deps.transactionRepository.selectAccount(accountKey) !== undefined) {
                        setSyncing(accountKey, false);
                    }
                });
                running.set(accountKey, run);
            });
        },

        isSyncing: accountKey => running.has(accountKey),

        close: async () => {
            isClosed = true;
            reruns.clear();
            await Promise.all(running.values());
        },
    };
};
