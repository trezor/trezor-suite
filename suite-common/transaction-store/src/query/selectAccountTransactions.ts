import type { NetworkSymbol } from '@suite-common/wallet-config';

import { someTransfer, transactionStoreDb } from './transactionStoreDatabase';
import { matchesTransactionSearch } from '../search/matchesTransactionSearch';
import type { TransactionSearch } from '../search/transactionSearch';
import { isNotSuspicious } from '../suspicious/isNotSuspicious';
import type { SuspiciousTransactionsContext } from '../transactionStoreTypes';

export type SelectAccountTransactionsParams = {
    accountKey: string;
    symbol: NetworkSymbol;
    /**
     * Only transactions moving this asset: a token's contract, or `null` for the network's own
     * coin. Left out, every transaction.
     */
    contract?: string | null;
    /** Only the transactions the search matches; see `parseTransactionSearch`. */
    search?: TransactionSearch;
    /** Without the suspicious ones, decided in SQL from what the app fed; see `isNotSuspicious`. */
    hideSuspicious?: SuspiciousTransactionsContext;
};

/**
 * An account's transactions, aliased `t`, filtered; the caller picks the columns, order and page,
 * or counts them.
 */
export const selectAccountTransactions = ({
    accountKey,
    symbol,
    contract,
    search,
    hideSuspicious,
}: SelectAccountTransactionsParams) => {
    let query = transactionStoreDb
        .selectFrom('transactions as t')
        .where('t.account_key', '=', accountKey);

    if (contract !== undefined) {
        // `IS` matches `NULL` too, so the same condition serves the coin and a token.
        query = query.where(eb => someTransfer(eb, fb => fb('f.contract', 'is', contract)));
    }
    if (search !== undefined) {
        query = query.where(eb => matchesTransactionSearch(eb, search));
    }
    if (hideSuspicious !== undefined) {
        query = query.where(eb => isNotSuspicious(eb, { ...hideSuspicious, symbol }));
    }

    return query;
};
