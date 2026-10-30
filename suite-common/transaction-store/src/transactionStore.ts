import type {
    SelectTransactionsParams,
    TransactionsFilter,
} from './repository/createTransactionRepository';
import type {
    AccountSyncStatus,
    KnownTokens,
    StoredTransaction,
    TransactionStoreAccount,
    TransactionStoreListener,
    Unsubscribe,
} from './transactionStoreTypes';

/**
 * What the app uses. Every method is async, so the in-process store (native) and the RPC client
 * of a store in a worker (web, desktop) are interchangeable.
 */
export type TransactionStore = {
    /**
     * The accounts the store may sync: the app's whole list. Any other stored account is deleted
     * with its history (a forgotten or not remembered wallet). Nothing is downloaded for them
     * until something asks (`ensureSynced`).
     */
    setAccounts: (accounts: TransactionStoreAccount[]) => Promise<void>;
    /**
     * Downloads the newest history of accounts never synced, and resolves with their status once
     * it is stored (or failed), as well as any sync running for them. They stay fresh through
     * `refreshAccounts`; the whole history only comes on `requestFullHistory`.
     */
    ensureSynced: (accountKeys: string[]) => Promise<AccountSyncStatus[]>;
    /** The app saw these accounts change: syncs the ones the store tracks, ignores the rest. */
    refreshAccounts: (accountKeys: string[]) => Promise<void>;
    /** Walks the account's history back to its first transaction, in the background. */
    requestFullHistory: (accountKey: string) => Promise<void>;
    getSyncStatus: (accountKeys: string[]) => Promise<AccountSyncStatus[]>;
    /**
     * The networks' token definitions, which hiding suspicious transactions needs to tell an
     * unknown token in SQL; see `toSuspiciousClause`.
     */
    setKnownTokens: (knownTokens: KnownTokens[]) => Promise<void>;
    selectTransactions: (params: SelectTransactionsParams) => Promise<StoredTransaction[]>;
    countTransactions: (filter: TransactionsFilter) => Promise<number>;
    subscribe: (listener: TransactionStoreListener) => Promise<Unsubscribe>;
    /** Lets running syncs finish and resolves once nothing runs. */
    dispose: () => Promise<void>;
};

export type TransactionStoreDep = { transactionStore: TransactionStore };
