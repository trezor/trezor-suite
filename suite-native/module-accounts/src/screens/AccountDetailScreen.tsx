import React, { memo, useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { RouteProp, useRoute } from '@react-navigation/native';

import { HomeStackParamList, HomeStackRoutes, Screen } from '@suite-native/navigation';
import {
    AccountsRootState,
    fetchTransactionsThunk,
    selectAccountLabel,
    selectAccountByKey,
    TransactionsRootState,
} from '@suite-common/wallet-core';
import { FiatRatesRootState } from '@suite-native/fiat-rates';
import { TransactionList } from '@suite-native/transactions';
import {
    selectAccountOrTokenAccountTransactions,
    selectEthereumAccountToken,
} from '@suite-native/ethereum-tokens';
import { analytics, EventType } from '@suite-native/analytics';
import { SettingsSliceRootState } from '@suite-native/module-settings';

import { TransactionListHeader } from '../components/TransactionListHeader';
import { AccountDetailScreenHeader } from '../components/AccountDetailScreenHeader';
import { TokenAccountDetailScreenHeader } from '../components/TokenAccountDetailScreenHeader';

export const AccountDetailScreen = memo(() => {
    const route = useRoute<RouteProp<HomeStackParamList, HomeStackRoutes.AccountDetail>>();
    const { accountKey, tokenSymbol } = route.params;
    const dispatch = useDispatch();
    const [areTokensIncluded, setAreTokensIncluded] = useState(false);
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const accountLabel = useSelector((state: AccountsRootState) =>
        selectAccountLabel(state, accountKey),
    );
    const accountTransactions = useSelector(
        (state: TransactionsRootState & FiatRatesRootState & SettingsSliceRootState) =>
            selectAccountOrTokenAccountTransactions(
                state,
                accountKey,
                tokenSymbol ?? null,
                areTokensIncluded,
            ),
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

    const toggleIncludeTokenTransactions = useCallback(() => {
        setAreTokensIncluded(prev => !prev);
    }, []);

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
            // The padding is handled inside of the TransactionList to prevent scrollbar glitches.
            customVerticalPadding={0}
            customHorizontalPadding={0}
            isScrollable={false}
        >
            <TransactionList
                areTokensIncluded={areTokensIncluded}
                accountKey={accountKey}
                tokenSymbol={tokenSymbol}
                transactions={accountTransactions}
                fetchMoreTransactions={fetchMoreTransactions}
                listHeaderComponent={
                    <TransactionListHeader
                        accountKey={accountKey}
                        tokenSymbol={tokenSymbol}
                        areTokensIncluded={areTokensIncluded}
                        toggleIncludeTokenTransactions={toggleIncludeTokenTransactions}
                    />
                }
            />
        </Screen>
    );
});
