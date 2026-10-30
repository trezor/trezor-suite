import type { TransactionRepositoryDep } from '../repository/createTransactionRepository';
import type { AccountSyncStatus, SyncMode } from '../transactionStoreTypes';
import type { SyncAccountTransactionsDep } from './createSyncAccountTransactions';

export type SyncQueueDeps = SyncAccountTransactionsDep &
    TransactionRepositoryDep & {
        onStatusChanged: (status: AccountSyncStatus) => void;
    };

export type SyncQueue = {
    requestSync: (params: { accountKeys: string[]; mode: SyncMode }) => void;
    getSyncStatus: (accountKey: string) => AccountSyncStatus;
    /** Resolves once the account's sync, with any asked for while it ran, is done. */
    whenSettled: (accountKey: string) => Promise<void>;
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

    const getSyncStatus = (accountKey: string): AccountSyncStatus => {
        const syncState = deps.transactionRepository.selectSyncState(accountKey);
        const getStatus = (): AccountSyncStatus['status'] => {
            if (running.has(accountKey)) return 'syncing';

            return syncState.lastError === null ? 'idle' : 'error';
        };

        return { accountKey, status: getStatus(), ...syncState };
    };

    const notifyStatus = (accountKey: string) => deps.onStatusChanged(getSyncStatus(accountKey));

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
                if (running.has(accountKey)) {
                    reruns.set(accountKey, mergeModes(reruns.get(accountKey), mode));

                    return;
                }

                const run = runSyncs(accountKey, mode).finally(() => {
                    running.delete(accountKey);
                    notifyStatus(accountKey);
                });
                running.set(accountKey, run);
                notifyStatus(accountKey);
            });
        },

        getSyncStatus,

        whenSettled: accountKey => running.get(accountKey) ?? Promise.resolve(),

        close: async () => {
            isClosed = true;
            reruns.clear();
            await Promise.all(running.values());
        },
    };
};
