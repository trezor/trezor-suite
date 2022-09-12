import React, { useEffect } from 'react';
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
    selectAccountName,
    selectAccount,
    TransactionsRootState,
    selectAccountTransactions,
} from '@suite-common/wallet-core';
import { Box, Text } from '@suite-native/atoms';
import { TransactionList } from '@suite-native/transactions';

import { AccountBalance } from '../components/AccountBalance';

export const AccountDetailScreen = ({
    route,
}: StackProps<AccountsStackParamList, AccountsStackRoutes.AccountDetail>) => {
    const { accountKey } = route.params;
    const account = useSelector((state: AccountsRootState) => selectAccount(state, accountKey));
    const accountName = useSelector((state: AccountsRootState) =>
        selectAccountName(state, accountKey),
    );
    const accountTransactions = useSelector((state: TransactionsRootState) =>
        selectAccountTransactions(state, accountKey),
    );
    const dispatch = useDispatch();

    useEffect(() => {
        if (!account) return;
        const promise = dispatch(
            fetchTransactionsThunk({
                account,
                page: 1,
                perPage: 100, // TODO add support for pagination.
            }),
        );
        return () => {
            promise.abort();
        };
    }, [account, dispatch]);

    if (!account) return null;

    return (
        <Screen header={<ScreenHeader />}>
            <AccountBalance accountName={accountName} account={account} />
            <Box>
                <Box marginBottom="large">
                    <Text variant="titleSmall">Transactions</Text>
                </Box>
                <TransactionList transactions={accountTransactions} />
            </Box>
        </Screen>
    );
};
