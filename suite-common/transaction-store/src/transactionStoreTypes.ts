import type { NetworkSymbol } from '@suite-common/wallet-config';
import type { Transaction } from '@trezor/blockchain-link-types';

/** An account whose history the store keeps, identified by the app's account key. */
export type TransactionStoreAccount = {
    accountKey: string;
    symbol: NetworkSymbol;
    descriptor: string;
};

export type StoredTransaction = {
    accountKey: string;
    txid: string;
    /** Absent while the transaction waits in the mempool. */
    blockHeight: number | null;
    blockTime: number | null;
    transaction: Transaction;
};

/** A network's token definitions as the store needs them: which contracts count as known. */
export type KnownTokens = {
    symbol: NetworkSymbol;
    /** Known coin contracts; `null` while the app has no definitions for the network. */
    coin: string[] | null;
    nft: string[] | null;
};

/** What the app knows that deciding a transaction is suspicious also needs. */
export type SuspiciousTransactionsContext = {
    /** Transactions the user marked as not a scam, which always stay. */
    notScamTxids: string[];
    /**
     * Transactions the app's own detection flagged from what only it has, such as the fiat
     * rates dust needs; hidden along with what the store detects itself.
     */
    flaggedTxids: string[];
};

/** `latest` fetches until it reaches stored history, `full` until the account's first transaction. */
export type SyncMode = 'latest' | 'full';

/** Never carries a backend's own message, which may echo an address. */
export type TransactionSourceErrorType = 'BackendUnavailable' | 'BackendError';

export type AccountSyncStatus = {
    accountKey: string;
    status: 'idle' | 'syncing' | 'error';
    /** The whole history is stored, not just its newest part. */
    isComplete: boolean;
    lastSyncedAt: number | null;
    lastError: TransactionSourceErrorType | null;
};

export type TransactionStoreEvent =
    | { type: 'syncStatusChanged'; status: AccountSyncStatus }
    | { type: 'transactionsChanged'; accountKeys: string[] };

export type TransactionStoreListener = (event: TransactionStoreEvent) => void;

export type Unsubscribe = () => void;

/** What every `start…` returns: undoes what it started, resolving once it has stopped. */
export type Dispose = () => Promise<void>;
