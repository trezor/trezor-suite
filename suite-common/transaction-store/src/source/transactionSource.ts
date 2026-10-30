import type { Transaction } from '@trezor/blockchain-link-types';
import type { Result } from '@trezor/type-utils';

import type { StoredAccount, TransactionSourceErrorType } from '../transactionStoreTypes';

export type TransactionsPage = {
    /** Newest first. */
    transactions: Transaction[];
    hasNextPage: boolean;
};

export type FetchTransactionsPageParams = {
    account: StoredAccount;
    /** 1 is the newest page. */
    page: number;
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
