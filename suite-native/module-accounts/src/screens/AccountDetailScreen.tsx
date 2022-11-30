import React, { memo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    AccountsStackParamList,
    AccountsStackRoutes,
    Screen,
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

import { TransactionListHeader } from '../components/TransactionListHeader';
import { AccountDetailScreenHeader } from '../components/AccountDetailScreenHeader';

export const AccountDetailScreen = memo(
    ({ route }: StackProps<AccountsStackParamList, AccountsStackRoutes.AccountDetail>) => {
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
            (pageToFetch: number, perPage: number) => {
                dispatch(
                    fetchTransactionsThunk({
                        accountKey,
                        page: pageToFetch,
                        perPage,
                    }),
                ).unwrap();
            },
            [accountKey, dispatch],
        );

        if (!account) return null;

        return (
            <Screen
                header={
                    <AccountDetailScreenHeader accountName={accountName} accountKey={accountKey} />
                }
                customHorizontalPadding={0}
                isScrollable={false}
            >
                <TransactionList
                    accountKey={accountKey}
                    transactions={accountTransactions}
                    fetchMoreTransactions={fetchMoreTransactions}
                    listHeaderComponent={<TransactionListHeader accountKey={accountKey} />}
                />
            </Screen>
        );
    },
);
