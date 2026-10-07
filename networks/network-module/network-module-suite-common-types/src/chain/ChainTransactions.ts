import type {
    AccountAddresses,
    BaseCurrencyCode,
    Transaction,
} from '@trezor/blockchain-link-types';

import type { ChainAccountRef } from './ChainAccountRef';

/**
 * Where the next page of an account's history starts. Every network counts pages; cursor-based
 * backends add their own position. Plain data, so a cache can hold it as a page parameter.
 */
export type ChainTransactionsCursor = {
    readonly page: number;
    readonly marker?: { readonly ledger: number; readonly seq: number };
    readonly pageCursor?: string;
};

export type ChainTransactionsPage = {
    /** Newest first, as the backend lists them, relative to the account. */
    readonly transactions: readonly Transaction[];

    /** `null` at the end of the history. */
    readonly nextCursor: ChainTransactionsCursor | null;

    /** Number of transactions in the history, `null` where the backend does not know it. */
    readonly total: number | null;

    /** The account's addresses, on networks whose transactions are read against them. */
    readonly addresses?: AccountAddresses;
};

export type GetTransactionsParams = {
    ref: ChainAccountRef;
    cursor: ChainTransactionsCursor;
    signal: AbortSignal;
};

/** Rate by unix time in seconds; a time with no known rate is left out. */
export type HistoricFiatRates = Readonly<Record<number, number>>;

export type GetHistoricFiatRatesParams = {
    /** The token to quote instead of the network's native coin. */
    contract?: string;
    currency: BaseCurrencyCode;
    timestamps: readonly number[];
    signal: AbortSignal;
};
