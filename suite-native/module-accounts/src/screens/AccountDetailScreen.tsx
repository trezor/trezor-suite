import React, { memo, useCallback, useEffect } from 'react';
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

import { AccountDetailHeader } from '../components/AccountDetailHeader';

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

        useEffect(() => {
            console.log(accountTransactions.length, 'accountTransactionsLength');
        }, [accountTransactions]);

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
            <Screen header={<ScreenHeader />} isScrollable={false}>
                <TransactionList
                    transactions={accountTransactions}
                    fetchMoreTransactions={fetchMoreTransactions}
                    listHeaderComponent={
                        <AccountDetailHeader accountKey={accountKey} accountName={accountName} />
                    }
                />
            </Screen>
        );
    },
);
