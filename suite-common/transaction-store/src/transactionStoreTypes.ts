import type { NetworkSymbol } from '@suite-common/wallet-config';

/** An account whose history the store keeps, identified by the app's account key. */
export type TransactionStoreAccount = {
    accountKey: string;
    symbol: NetworkSymbol;
    descriptor: string;
    /**
     * What the app last learned of the account's history. The app's own refresh updates it, so a
     * change is the store's cue to sync the account, if anything has asked for it.
     */
    revision: string;
};

/** An account as the store keeps it; the revision is only the app's. */
export type StoredAccount = Omit<TransactionStoreAccount, 'revision'>;

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

export type Unsubscribe = () => void;

/** What every `start…` returns: undoes what it started, resolving once it has stopped. */
export type Dispose = () => Promise<void>;
