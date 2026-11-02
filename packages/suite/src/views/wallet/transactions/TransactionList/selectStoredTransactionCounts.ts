import { shallowEqual } from 'react-redux';

import {
    type TransactionsRootState,
    selectAccountTransactionsWithNulls,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { createWeakMapSelector } from '@trezor/redux-utils';

const createMemoizedSelector = createWeakMapSelector.withTypes<TransactionsRootState>();

export const selectStoredTransactionCounts = createMemoizedSelector(
    [
        (state: TransactionsRootState) => state,
        (_state: TransactionsRootState, accounts: readonly Account[]) => accounts,
    ],
    (state, accounts) =>
        accounts.map(account => selectAccountTransactionsWithNulls(state, account.key).length),
    { memoizeOptions: { resultEqualityCheck: shallowEqual } },
);
