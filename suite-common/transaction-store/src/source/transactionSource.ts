import type { NetworkSymbol } from '@suite-common/wallet-config';
import type { Transaction } from '@trezor/blockchain-link-types';
import type { Result } from '@trezor/type-utils';

import type {
    TransactionSourceErrorType,
    TransactionStoreAccount,
    Unsubscribe,
} from '../transactionStoreTypes';

export type TransactionsPage = {
    /** Newest first. */
    transactions: Transaction[];
    hasNextPage: boolean;
};

export type FetchTransactionsPageParams = {
    account: TransactionStoreAccount;
    /** 1 is the newest page. */
    page: number;
};

export type SubscribeBlocksParams = {
    symbol: NetworkSymbol;
    onBlock: () => void;
};

/**
 * Where the store gets history from; each platform entry provides it over its blockchain-link
 * instances, so custom backends apply.
 *
 * @serviceContract
 */
export type TransactionSource = {
    fetchTransactionsPage: (
        params: FetchTransactionsPageParams,
    ) => Promise<Result<TransactionsPage, TransactionSourceErrorType>>;
    subscribeBlocks: (
        params: SubscribeBlocksParams,
    ) => Promise<Result<Unsubscribe, TransactionSourceErrorType>>;
};

export type TransactionSourceDep = { transactionSource: TransactionSource };
