import React, { memo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context';

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
import { Box } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { TransactionListHeader } from '../components/TransactionListHeader';
import { AccountDetailScreenHeader } from '../components/AccountDetailScreenHeader';

const transactionListWrapperStyle = prepareNativeStyle<{
    insets: EdgeInsets;
}>((utils, { insets }) => {
    const { bottom, left, right } = insets;
    return {
        flexGrow: 1,
        paddingTop: utils.spacings.small,
        paddingBottom: Math.max(bottom, utils.spacings.small),
        paddingLeft: Math.max(left, utils.spacings.small),
        paddingRight: Math.max(right, utils.spacings.small),
    };
});

export const AccountDetailScreen = memo(
    ({ route }: StackProps<AccountsStackParamList, AccountsStackRoutes.AccountDetail>) => {
        const { accountKey } = route.params;
        const insets = useSafeAreaInsets();
        const { applyStyle } = useNativeStyles();

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
            >
                <Box style={applyStyle(transactionListWrapperStyle, { insets })}>
                    <TransactionList
                        accountKey={accountKey}
                        transactions={accountTransactions}
                        fetchMoreTransactions={fetchMoreTransactions}
                        listHeaderComponent={<TransactionListHeader accountKey={accountKey} />}
                    />
                </Box>
            </Screen>
        );
    },
);
