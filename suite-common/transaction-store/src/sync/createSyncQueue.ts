import type { NetworkSymbol } from '@suite-common/wallet-config';

import type { TransactionRepositoryDep } from '../repository/createTransactionRepository';
import type { AccountSyncStatus, SyncMode } from '../transactionStoreTypes';
import type { SyncAccountTransactionsDep } from './createSyncAccountTransactions';

export type SyncQueueDeps = SyncAccountTransactionsDep &
    TransactionRepositoryDep & {
        /** Keeps one slow backend from holding up the others, and from being hammered. */
        maxConcurrentJobsPerNetwork: number;
        onStatusChanged: (status: AccountSyncStatus) => void;
    };

export type SyncQueue = {
    requestSync: (params: { accountKeys: string[]; mode: SyncMode }) => void;
    getSyncStatus: (accountKey: string) => AccountSyncStatus;
    /** Resolves once the account has no job queued or running, its result stored or recorded. */
    whenSettled: (accountKey: string) => Promise<void>;
    whenIdle: () => Promise<void>;
    /** Takes no more jobs and resolves once the running ones are done. */
    close: () => Promise<void>;
};

export type SyncQueueDep = { syncQueue: SyncQueue };

type RunningJob = { symbol: NetworkSymbol; rerunMode: SyncMode | null };

const mergeModes = (a: SyncMode | null | undefined, b: SyncMode): SyncMode =>
    a === 'full' || b === 'full' ? 'full' : 'latest';

export const createSyncQueue = (deps: SyncQueueDeps): SyncQueue => {
    // Insertion order is the order jobs start in.
    const queued = new Map<string, SyncMode>();
    const running = new Map<string, RunningJob>();
    let idleWaiters: Array<() => void> = [];
    const settleWaiters = new Map<string, Array<() => void>>();
    let isClosed = false;

    const getSyncStatus = (accountKey: string): AccountSyncStatus => {
        const syncState = deps.transactionRepository.selectSyncState(accountKey);
        const getStatus = (): AccountSyncStatus['status'] => {
            if (running.has(accountKey)) return 'syncing';
            if (queued.has(accountKey)) return 'queued';

            return syncState.lastError === null ? 'idle' : 'error';
        };

        return { accountKey, status: getStatus(), ...syncState };
    };

    const notifyStatus = (accountKey: string) => deps.onStatusChanged(getSyncStatus(accountKey));

    const resolveIdleWaiters = () => {
        if (queued.size > 0 || running.size > 0) return;

        idleWaiters.forEach(resolve => resolve());
        idleWaiters = [];
    };

    const resolveSettleWaiters = (accountKey: string) => {
        if (queued.has(accountKey) || running.has(accountKey)) return;

        settleWaiters.get(accountKey)?.forEach(resolve => resolve());
        settleWaiters.delete(accountKey);
    };

    const countRunning = (symbol: NetworkSymbol) =>
        [...running.values()].filter(job => job.symbol === symbol).length;

    const runJob = async (accountKey: string, mode: SyncMode) => {
        // An unexpected failure (the database, not the backend) must not leave the account
        // stuck as syncing; the next request retries it.
        await deps.syncAccountTransactions({ accountKey, mode }).catch(() => undefined);
        // Only a request made while it ran; nothing continues on its own.
        const rerunMode = running.get(accountKey)?.rerunMode ?? null;
        running.delete(accountKey);

        if (rerunMode !== null && !isClosed) {
            queued.set(accountKey, mergeModes(queued.get(accountKey), rerunMode));
        }

        notifyStatus(accountKey);
        resolveSettleWaiters(accountKey);
    };

    const startJobs = () => {
        [...queued].forEach(([accountKey, mode]) => {
            const account = deps.transactionRepository.selectAccount(accountKey);

            if (account === undefined) {
                queued.delete(accountKey);
                resolveSettleWaiters(accountKey);

                return;
            }
            if (countRunning(account.symbol) >= deps.maxConcurrentJobsPerNetwork) return;

            queued.delete(accountKey);
            running.set(accountKey, { symbol: account.symbol, rerunMode: null });
            notifyStatus(accountKey);
            void runJob(accountKey, mode).then(() => {
                startJobs();
                resolveIdleWaiters();
            });
        });
    };

    return {
        requestSync: ({ accountKeys, mode }) => {
            if (isClosed) return;

            accountKeys.forEach(accountKey => {
                const runningJob = running.get(accountKey);

                if (runningJob !== undefined) {
                    // The running job may have fetched its page before what triggered this.
                    runningJob.rerunMode = mergeModes(runningJob.rerunMode, mode);

                    return;
                }

                const wasQueued = queued.has(accountKey);
                queued.set(accountKey, mergeModes(queued.get(accountKey), mode));
                if (!wasQueued) notifyStatus(accountKey);
            });
            startJobs();
            resolveIdleWaiters();
        },

        getSyncStatus,

        whenSettled: accountKey =>
            new Promise<void>(resolve => {
                settleWaiters.set(accountKey, [...(settleWaiters.get(accountKey) ?? []), resolve]);
                resolveSettleWaiters(accountKey);
            }),

        whenIdle: () =>
            new Promise<void>(resolve => {
                idleWaiters.push(resolve);
                resolveIdleWaiters();
            }),

        close: () => {
            isClosed = true;
            const droppedAccountKeys = [...queued.keys()];
            queued.clear();
            droppedAccountKeys.forEach(resolveSettleWaiters);

            return new Promise<void>(resolve => {
                idleWaiters.push(resolve);
                resolveIdleWaiters();
            });
        },
    };
};
