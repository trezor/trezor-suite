import type { TransactionStoreQuery } from './query/transactionStoreDatabase';
import type { KnownTokens, TransactionStoreAccount, Unsubscribe } from './transactionStoreTypes';

/**
 * What the app uses; it runs where the app does, with SQLite wherever the platform keeps it (a
 * worker on web and desktop). Reads are queries the app builds with `createTransactionStoreQuery`;
 * the store runs them read-only.
 */
export type TransactionStore = {
    /**
     * The app's whole list of accounts. Any other stored account is deleted with its history (a
     * forgotten or not remembered wallet); an account whose revision changed is synced, if
     * anything has asked for it.
     */
    setAccounts: (accounts: TransactionStoreAccount[]) => Promise<void>;
    /**
     * The networks' token definitions, which hiding suspicious transactions needs to tell an
     * unknown token in SQL; see `isNotSuspicious`.
     */
    setKnownTokens: (knownTokens: KnownTokens[]) => Promise<void>;
    /** Walks the account's history back to its first transaction, in the background. */
    requestFullHistory: (accountKey: string) => Promise<void>;
    /**
     * Calls back with the query's rows now, and again whenever a write changes them. The newest
     * history of the query's accounts is downloaded first if they were never synced.
     */
    subscribeQuery: <TRow>(
        query: TransactionStoreQuery<TRow>,
        onRows: (rows: TRow[]) => void,
    ) => Unsubscribe;
    /** Lets running syncs finish and resolves once nothing runs. */
    dispose: () => Promise<void>;
};

export type TransactionStoreDep = { transactionStore: TransactionStore };
