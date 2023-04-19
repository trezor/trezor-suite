import React, { memo, useCallback, useEffect } from 'react';
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
} from '@suite-common/wallet-core';
import { TransactionList } from '@suite-native/transactions';
import {
    selectAccountOrTokenAccountTransactions,
    selectEthereumAccountToken,
} from '@suite-native/ethereum-tokens';
import { analytics, EventType } from '@suite-native/analytics';

import { TransactionListHeader } from '../components/TransactionListHeader';
import { AccountDetailScreenHeader } from '../components/AccountDetailScreenHeader';
import { TokenAccountDetailScreenHeader } from '../components/TokenAccountDetailScreenHeader';

export const AccountDetailScreen = memo(
    ({ route }: StackProps<AccountsStackParamList, AccountsStackRoutes.AccountDetail>) => {
        const dispatch = useDispatch();
        const { accountKey, tokenSymbol } = route.params;
        const account = useSelector((state: AccountsRootState) =>
            selectAccountByKey(state, accountKey),
        );
        const accountLabel = useSelector((state: AccountsRootState) =>
            selectAccountLabel(state, accountKey),
        );
        const accountTransactions = useSelector((state: TransactionsRootState) =>
            selectAccountOrTokenAccountTransactions(state, accountKey, tokenSymbol ?? null),
        );
        const token = useSelector((state: AccountsRootState) =>
            selectEthereumAccountToken(state, accountKey, tokenSymbol),
        );

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

        useEffect(() => {
            if (account) {
                analytics.report({
                    type: EventType.AssetDetail,
                    payload: { assetSymbol: account.symbol, tokenSymbol },
                });
            }
        }, [account, tokenSymbol]);

        if (!account) return null;

        return (
            <Screen
                header={
                    token?.name ? (
                        <TokenAccountDetailScreenHeader
                            tokenName={token.name}
                            accountKey={accountKey}
                        />
                    ) : (
                        <AccountDetailScreenHeader
                            accountLabel={accountLabel}
                            accountKey={accountKey}
                        />
                    )
                }
                isScrollable={false}
            >
                <TransactionList
                    accountKey={accountKey}
                    tokenSymbol={tokenSymbol}
                    transactions={accountTransactions}
                    fetchMoreTransactions={fetchMoreTransactions}
                    listHeaderComponent={
                        <TransactionListHeader accountKey={accountKey} tokenSymbol={tokenSymbol} />
                    }
                />
            </Screen>
        );
    },
);
