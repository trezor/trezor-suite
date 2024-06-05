import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Screen } from '@suite-native/navigation';
import {
    AccountsRootState,
    fetchTransactionsThunk,
    selectAccountLabel,
    selectAccountByKey,
    TransactionsRootState,
    FiatRatesRootState,
} from '@suite-common/wallet-core';
import { TransactionList } from '@suite-native/transactions';
import {
    selectAccountOrTokenAccountTransactions,
    selectEthereumAccountTokenInfo,
} from '@suite-native/ethereum-tokens';
import { analytics, EventType } from '@suite-native/analytics';
import { SettingsSliceRootState } from '@suite-native/settings';
import { TokenAddress } from '@suite-common/wallet-types';

import { TransactionListHeader } from '../components/TransactionListHeader';
import { AccountDetailScreenHeader } from '../components/AccountDetailScreenHeader';
import { TokenAccountDetailScreenSubHeader } from '../components/TokenAccountDetailScreenSubHeader';

type AccountDetailContentScreenProps = {
    accountKey: string;
    tokenContract?: TokenAddress;
};

export const AccountDetailContentScreen = ({
    accountKey,
    tokenContract,
}: AccountDetailContentScreenProps) => {
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
            accountKey
                ? selectAccountOrTokenAccountTransactions(
                      state,
                      accountKey,
                      tokenContract ?? null,
                      areTokensIncluded,
                  )
                : [],
    );
    const token = useSelector((state: AccountsRootState) =>
        selectEthereumAccountTokenInfo(state, accountKey, tokenContract),
    );

    const fetchMoreTransactions = useCallback(
        (pageToFetch: number, perPage: number) => {
            if (!accountKey) {
                return;
            }
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
                payload: {
                    assetSymbol: account.symbol,
                    tokenSymbol: token?.symbol,
                    tokenAddress: token?.contract,
                },
            });
        }
    }, [account, token?.symbol, token?.contract]);

    const toggleIncludeTokenTransactions = useCallback(() => {
        setAreTokensIncluded(prev => !prev);
    }, []);

    const listHeaderComponent = useMemo(
        () => (
            <TransactionListHeader
                accountKey={accountKey}
                tokenContract={tokenContract}
                areTokensIncluded={areTokensIncluded}
                toggleIncludeTokenTransactions={toggleIncludeTokenTransactions}
            />
        ),
        [accountKey, tokenContract, areTokensIncluded, toggleIncludeTokenTransactions],
    );

    return (
        <Screen
            screenHeader={
                token?.name ? (
                    <TokenAccountDetailScreenSubHeader
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
            // The padding is handled inside the TransactionList to prevent scrollbar glitches.
            customVerticalPadding={0}
            customHorizontalPadding={0}
            isScrollable={false}
        >
            <TransactionList
                areTokensIncluded={areTokensIncluded}
                accountKey={accountKey}
                tokenContract={tokenContract}
                transactions={accountTransactions}
                fetchMoreTransactions={fetchMoreTransactions}
                listHeaderComponent={listHeaderComponent}
            />
        </Screen>
    );
};
