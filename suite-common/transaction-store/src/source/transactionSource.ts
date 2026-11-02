import type { Transaction } from '@trezor/blockchain-link-types';
import type { Result } from '@trezor/type-utils';

import type { StoredAccount, TransactionSourceErrorType } from '../transactionStoreTypes';

/**
 * Where the next page starts, in the source's own terms (a page number, a ledger marker, a
 * cursor...). Opaque to the engine, which only hands it back to fetch that page.
 */
export type TransactionsPageCursor = { readonly [key: string]: unknown };

export type TransactionsPage = {
    /** Newest first. */
    transactions: Transaction[];
    /** The next, older page; `undefined` once this is the last one. */
    nextPage?: TransactionsPageCursor;
};

export type FetchTransactionsPageParams = {
    account: StoredAccount;
    /** The page the previous one pointed to; left out, the newest page. */
    after?: TransactionsPageCursor;
};

/**
 * Where the store gets history from; each platform entry provides it over the app's own backend
 * connection, so custom backends apply. It only fetches when asked: when to sync is the app's call.
 *
 * @serviceContract
 */
export type TransactionSource = {
    fetchTransactionsPage: (
        params: FetchTransactionsPageParams,
    ) => Promise<Result<TransactionsPage, TransactionSourceErrorType>>;
};

export type TransactionSourceDep = { transactionSource: TransactionSource };
