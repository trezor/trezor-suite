import type {
    Dispose,
    TransactionStoreAccount,
    Unsubscribe,
} from '@suite-common/transaction-store';
import type { CustomBackend } from '@suite-common/wallet-types';

import type { GetTransactionStoreServiceDep } from './createTransactionStoreService';
import {
    type TransactionStoreFeedState,
    selectTransactionStoreAccountRevisions,
    selectTransactionStoreAccounts,
    selectTransactionStoreBackends,
} from './transactionStoreFeedSelectors';

export type StartTransactionStoreFeedDeps = GetTransactionStoreServiceDep & {
    getState: () => TransactionStoreFeedState;
    subscribe: (listener: () => void) => Unsubscribe;
    /** Whether the store runs at all; until a screen uses it, only in debug mode. */
    getIsEnabled: () => boolean;
};

/**
 * Starts feeding the store and returns what stops it. Called once Connect is initialised, since
 * the networks' default backends come from it.
 */
export type StartTransactionStoreFeed = () => Dispose;

export type StartTransactionStoreFeedDep = { startTransactionStoreFeed: StartTransactionStoreFeed };

export const injectStartTransactionStoreFeed = (services: any): StartTransactionStoreFeedDep => ({
    startTransactionStoreFeed: services.startTransactionStoreFeed,
});

type Fed = {
    accounts: TransactionStoreAccount[];
    backends: CustomBackend[];
    revisions: ReadonlyMap<string, string>;
};

/**
 * Keeps the store told what the app knows: its accounts and their backends, and when the app's
 * own refresh found an account changed, which is when the store syncs it. The store has no clock
 * of its own. Pushes only what changed, and stops the store when it gets disabled.
 */
export const createStartTransactionStoreFeed =
    (deps: StartTransactionStoreFeedDeps): StartTransactionStoreFeed =>
    () => {
        // What the store was last told; `null` while it is not running.
        let fed: Fed | null = null;

        const stop = async () => {
            if (fed === null) return;

            fed = null;
            await deps.getTransactionStoreService().dispose();
        };

        const feed = () => {
            if (!deps.getIsEnabled()) {
                void stop();

                return;
            }

            const state = deps.getState();
            const accounts = selectTransactionStoreAccounts(state);
            const backends = selectTransactionStoreBackends(state);
            const revisions = selectTransactionStoreAccountRevisions(state);
            const service = deps.getTransactionStoreService();
            const accountKeys = accounts.map(({ accountKey }) => accountKey);

            if (accounts !== fed?.accounts) {
                // The whole list: the store diffs it against what it holds and deletes the rest,
                // so a forgotten wallet's history goes even if it left while the store was off.
                // Safe from the start, as the feed starts after the stored accounts are loaded.
                void service.transactionStore.setAccounts(accounts);
            }
            if (backends !== fed?.backends) {
                // Every account syncs once its backend is set (or switched), new ones included,
                // whose first sync may have run before the backends arrived.
                void service
                    .setBackends(backends)
                    .then(() =>
                        service.transactionStore.requestSync({ accountKeys, mode: 'latest' }),
                    );
            } else if (revisions !== fed?.revisions) {
                const previousRevisions = fed?.revisions;
                const changedAccountKeys = [...revisions]
                    .filter(([key, revision]) => previousRevisions?.get(key) !== revision)
                    .map(([key]) => key);

                void service.transactionStore.requestSync({
                    accountKeys: changedAccountKeys,
                    mode: 'latest',
                });
            }

            fed = { accounts, backends, revisions };
        };

        feed();
        const unsubscribe = deps.subscribe(feed);

        return () => {
            unsubscribe();

            return stop();
        };
    };
