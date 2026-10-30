import type { TransactionStoreQuery } from './query/transactionStoreDatabase';
import type { KnownTokens, TransactionStoreAccount, Unsubscribe } from './transactionStoreTypes';

/**
 * What the app uses. The commands are async, so the in-process store (native) and the RPC client
 * of a store in a worker (web, desktop) are interchangeable. Reads are queries the app builds with
 * `transactionStoreDb`; the store runs them read-only.
 */
export type TransactionStore = {
    /**
     * The accounts the store may sync: the app's whole list. Any other stored account is deleted
     * with its history (a forgotten or not remembered wallet). Nothing is downloaded for them
     * until something asks (`ensureSynced`).
     */
    setAccounts: (accounts: TransactionStoreAccount[]) => Promise<void>;
    /**
     * Downloads the newest history of accounts never synced, and resolves once it is stored (or
     * failed), as well as any sync running for them. They stay fresh through `refreshAccounts`;
     * the whole history only comes on `requestFullHistory`.
     */
    ensureSynced: (accountKeys: string[]) => Promise<void>;
    /** The app saw these accounts change: syncs the ones the store tracks, ignores the rest. */
    refreshAccounts: (accountKeys: string[]) => Promise<void>;
    /** Walks the account's history back to its first transaction, in the background. */
    requestFullHistory: (accountKey: string) => Promise<void>;
    /**
     * The networks' token definitions, which hiding suspicious transactions needs to tell an
     * unknown token in SQL; see `isNotSuspicious`.
     */
    setKnownTokens: (knownTokens: KnownTokens[]) => Promise<void>;
    /** The query's rows now. */
    query: <TRow>(query: TransactionStoreQuery<TRow>) => Promise<TRow[]>;
    /** Calls back with the query's rows now, and again whenever a write changes them. */
    subscribeQuery: <TRow>(
        query: TransactionStoreQuery<TRow>,
        onRows: (rows: TRow[]) => void,
    ) => Unsubscribe;
    /** Lets running syncs finish and resolves once nothing runs. */
    dispose: () => Promise<void>;
};

export type TransactionStoreDep = { transactionStore: TransactionStore };
