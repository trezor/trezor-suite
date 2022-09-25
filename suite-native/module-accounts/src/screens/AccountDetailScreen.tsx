import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    AccountsStackParamList,
    AccountsStackRoutes,
    Screen,
    ScreenHeader,
    StackProps,
} from '@suite-native/navigation';
import {
    AccountsRootState,
    fetchTransactionsThunk,
    selectAccountLabel,
    selectAccountByKey,
    TransactionsRootState,
    selectAccountTransactions,
} from '@suite-common/wallet-core';
import { TransactionList } from '@suite-native/transactions';

export const AccountDetailScreen = ({
    route,
}: StackProps<AccountsStackParamList, AccountsStackRoutes.AccountDetail>) => {
    const { accountKey } = route.params;
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const accountName = useSelector((state: AccountsRootState) =>
        selectAccountLabel(state, accountKey),
    );
    const accountTransactions = useSelector((state: TransactionsRootState) =>
        selectAccountTransactions(state, accountKey),
    );
    const dispatch = useDispatch();

    const fetchMoreTransactions = useCallback(
        (pageToFetch: number, perPage: number) =>
            dispatch(
                fetchTransactionsThunk({
                    accountKey,
                    page: pageToFetch,
                    perPage,
                }),
            ).unwrap(),
        [accountKey, dispatch],
    );

    if (!account) return null;

    return (
        <Screen header={<ScreenHeader />} isScrollable={false}>
            <TransactionList
                account={account}
                accountName={accountName}
                transactions={accountTransactions}
                fetchMoreTransactions={fetchMoreTransactions}
            />
        </Screen>
    );
};
