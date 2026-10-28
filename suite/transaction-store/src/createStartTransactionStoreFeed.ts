import type {
    Dispose,
    TransactionStoreAccount,
    Unsubscribe,
} from '@suite-common/transaction-store';
import type { CustomBackend } from '@suite-common/wallet-types';

import type { GetTransactionStoreServiceDep } from './createTransactionStoreService';
import {
    type TransactionStoreFeedState,
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

type Fed = { accounts: TransactionStoreAccount[]; backends: CustomBackend[] };

/**
 * Keeps the store told what the app knows: its accounts, the enabled networks and their
 * backends. Pushes only what changed, and stops the store when it gets disabled.
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
            const service = deps.getTransactionStoreService();

            if (accounts !== fed?.accounts) {
                // The whole list: the store diffs it against what it holds and deletes the rest,
                // so a forgotten wallet's history goes even if it left while the store was off.
                // Safe from the start, as the feed starts after the stored accounts are loaded.
                void service.transactionStore.setAccounts(accounts);
            }
            if (backends !== fed?.backends) {
                // Backends first, so the networks subscribe to blocks on them right away.
                void service
                    .setBackends(backends)
                    .then(() =>
                        service.transactionStore.watchNetworks(
                            backends.map(({ symbol }) => symbol),
                        ),
                    );
            }

            fed = { accounts, backends };
        };

        feed();
        const unsubscribe = deps.subscribe(feed);

        return () => {
            unsubscribe();

            return stop();
        };
    };
