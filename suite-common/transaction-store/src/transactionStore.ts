import type { NetworkSymbol } from '@suite-common/wallet-config';
import type { Result } from '@trezor/type-utils';

import type {
    SelectRowsError,
    SelectTransactionsParams,
    TransactionsFilter,
} from './repository/createTransactionRepository';
import type { SqlQuery, SqlRow } from './sqlite/transactionStoreSqlite';
import type {
    AccountSyncStatus,
    StoredTransaction,
    SyncMode,
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
     * The accounts the store keeps: the app's whole list. Any other stored account is deleted
     * with its history (a forgotten or not remembered wallet), and new ones are synced.
     */
    setAccounts: (accounts: TransactionStoreAccount[]) => Promise<void>;
    removeAccounts: (accountKeys: string[]) => Promise<void>;
    /** The networks to keep fresh (the connected ones); the ones left out stop being watched. */
    watchNetworks: (symbols: NetworkSymbol[]) => Promise<void>;
    requestSync: (params: { accountKeys: string[]; mode: SyncMode }) => Promise<void>;
    getSyncStatus: (accountKeys: string[]) => Promise<AccountSyncStatus[]>;
    selectTransactions: (params: SelectTransactionsParams) => Promise<StoredTransaction[]>;
    countTransactions: (filter: TransactionsFilter) => Promise<number>;
    /** Any read-only SQL over the schema in `schema/transactionStoreMigrations.ts`. */
    query: (query: SqlQuery) => Promise<Result<ReadonlyArray<SqlRow>, SelectRowsError>>;
    subscribe: (listener: TransactionStoreListener) => Promise<Unsubscribe>;
    whenIdle: () => Promise<void>;
    /** Stops watching, lets running jobs finish and resolves once nothing runs. */
    dispose: () => Promise<void>;
};

export type TransactionStoreDep = { transactionStore: TransactionStore };
