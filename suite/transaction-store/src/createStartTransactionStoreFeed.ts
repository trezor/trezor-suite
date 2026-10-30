import type {
    Dispose,
    KnownTokens,
    TransactionStoreAccount,
    Unsubscribe,
} from '@suite-common/transaction-store';

import type { EnsureTransactionStoreDep } from './createEnsureTransactionStore';

export type StartTransactionStoreFeedDeps = EnsureTransactionStoreDep & {
    /** The same reference while nothing the store needs of them changes. */
    getAccounts: () => TransactionStoreAccount[];
    /** The same reference until a list actually changes. */
    getKnownTokens: () => KnownTokens[];
    /** Whether the store runs at all; until a screen uses it, only in debug mode. */
    getIsEnabled: () => boolean;
    subscribe: (listener: () => void) => Unsubscribe;
};

/**
 * Starts feeding the store and returns what stops it. Called once the stored accounts are loaded,
 * as the store deletes the history of every account it is not given.
 */
export type StartTransactionStoreFeed = () => Dispose;

export type StartTransactionStoreFeedDep = { startTransactionStoreFeed: StartTransactionStoreFeed };

export const injectStartTransactionStoreFeed = (services: any): StartTransactionStoreFeedDep => ({
    startTransactionStoreFeed: services.startTransactionStoreFeed,
});

type Fed = {
    accounts: TransactionStoreAccount[];
    knownTokens: KnownTokens[];
};

/**
 * Keeps the store told what the app knows: its accounts, with what it last learned of their
 * history, and the networks' token definitions (for hiding suspicious transactions). The store
 * has no clock of its own. Pushes only what changed, and stops the store when it gets disabled.
 */
export const createStartTransactionStoreFeed =
    (deps: StartTransactionStoreFeedDeps): StartTransactionStoreFeed =>
    () => {
        // What the store was last told; `null` while it is not running.
        let fed: Fed | null = null;

        const stop = async () => {
            if (fed === null) return;

            fed = null;
            await deps.ensureTransactionStore().dispose();
        };

        const feed = () => {
            if (!deps.getIsEnabled()) {
                void stop();

                return;
            }

            const accounts = deps.getAccounts();
            const knownTokens = deps.getKnownTokens();
            const { transactionStore } = deps.ensureTransactionStore();

            if (accounts !== fed?.accounts) {
                // The whole list: the store deletes the history of any account not in it, so a
                // forgotten wallet's goes even if it left while the store was off, and syncs those
                // whose revision changed.
                void transactionStore.setAccounts(accounts);
            }
            if (knownTokens !== fed?.knownTokens) {
                void transactionStore.setKnownTokens(knownTokens);
            }

            fed = { accounts, knownTokens };
        };

        feed();
        const unsubscribe = deps.subscribe(feed);

        return () => {
            unsubscribe();

            return stop();
        };
    };
