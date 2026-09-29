import { type AccountKey } from '@suite-common/wallet-types';

type AccountSync = () => Promise<void>;

/**
 * Serialises account syncs per account key. A sync requested while one is already running for that
 * account does not start a second one - it queues a single trailing run, so whatever arrived
 * mid-sync is still picked up, and any further request joins that same trailing run.
 *
 * At most one sync runs and one waits per account, and the chain ends as soon as a run finishes
 * with nothing queued behind it, so a continuously credited account syncs back to back rather than
 * accumulating overlapping syncs.
 */
export const createAccountSyncQueue = () => {
    const runningSyncs = new Map<AccountKey, Promise<void>>();
    const trailingSyncs = new Map<AccountKey, Promise<void>>();

    const promoteTrailingSync = (accountKey: AccountKey) => {
        const trailingSync = trailingSyncs.get(accountKey);

        if (!trailingSync) {
            runningSyncs.delete(accountKey);

            return;
        }

        trailingSyncs.delete(accountKey);
        runningSyncs.set(accountKey, trailingSync);
    };

    // Started synchronously so the first request reaches the backend in the same tick as before.
    // The cleanup is chained on the promise, so it always runs after the caller has recorded the
    // sync as running, even when `sync` throws.
    const startSync = (accountKey: AccountKey, sync: AccountSync) => {
        let startedSync: Promise<void>;

        try {
            startedSync = sync();
        } catch (error) {
            startedSync = Promise.reject(error);
        }

        return startedSync.finally(() => promoteTrailingSync(accountKey));
    };

    return (accountKey: AccountKey, sync: AccountSync): Promise<void> => {
        const runningSync = runningSyncs.get(accountKey);

        if (!runningSync) {
            const startedSync = startSync(accountKey, sync);
            runningSyncs.set(accountKey, startedSync);

            return startedSync;
        }

        const trailingSync = trailingSyncs.get(accountKey);

        if (trailingSync) return trailingSync;

        const runTrailingSync = () => startSync(accountKey, sync);
        // Queued on both outcomes, so a failed sync does not cancel the one waiting behind it.
        const queuedSync = runningSync.then(runTrailingSync, runTrailingSync);
        trailingSyncs.set(accountKey, queuedSync);

        return queuedSync;
    };
};
