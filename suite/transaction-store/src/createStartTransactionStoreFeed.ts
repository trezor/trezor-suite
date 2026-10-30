import type {
    Dispose,
    KnownTokens,
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
    selectTransactionStoreKnownTokens,
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
    knownTokens: KnownTokens[];
};

/**
 * Keeps the store told what the app knows: its accounts and their backends, the networks' token
 * definitions (for hiding suspicious transactions), and when the app's
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
            const knownTokens = selectTransactionStoreKnownTokens(state);
            const service = deps.getTransactionStoreService();
            const accountKeys = accounts.map(({ accountKey }) => accountKey);

            if (accounts !== fed?.accounts) {
                // The whole list: the store diffs it against what it holds and deletes the rest,
                // so a forgotten wallet's history goes even if it left while the store was off.
                // Safe from the start, as the feed starts after the stored accounts are loaded.
                void service.transactionStore.setAccounts(accounts);
            }
            // The store syncs only the accounts something has asked for; it ignores the rest.
            if (backends !== fed?.backends) {
                // Once their backend is set or switched, including those whose first sync ran
                // before the backends arrived.
                void service
                    .setBackends(backends)
                    .then(() => service.transactionStore.refreshAccounts(accountKeys));
            } else if (revisions !== fed?.revisions) {
                const previousRevisions = fed?.revisions;

                void service.transactionStore.refreshAccounts(
                    [...revisions]
                        .filter(([key, revision]) => previousRevisions?.get(key) !== revision)
                        .map(([key]) => key),
                );
            }

            if (knownTokens !== fed?.knownTokens) {
                void service.transactionStore.setKnownTokens(knownTokens);
            }

            fed = { accounts, backends, revisions, knownTokens };
        };

        feed();
        const unsubscribe = deps.subscribe(feed);

        return () => {
            unsubscribe();

            return stop();
        };
    };
