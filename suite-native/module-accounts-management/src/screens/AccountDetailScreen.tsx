import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Dimensions } from 'react-native';

import { RouteProp, useRoute } from '@react-navigation/native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import {
    RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenSubHeader,
} from '@suite-native/navigation';
import {
    AccountsRootState,
    fetchTransactionsThunk,
    selectAccountLabel,
    selectAccountByKey,
    TransactionsRootState,
    DeviceRootState,
    selectDeviceAccountsForNetworkSymbolAndAccountTypeWithIndex,
} from '@suite-common/wallet-core';
import { FiatRatesRootState } from '@suite-native/fiat-rates';
import { TransactionList } from '@suite-native/transactions';
import {
    selectAccountOrTokenAccountTransactions,
    selectEthereumAccountTokenInfo,
} from '@suite-native/ethereum-tokens';
import { analytics, EventType } from '@suite-native/analytics';
import { SettingsSliceRootState } from '@suite-native/module-settings';
import { BoxSkeleton, Card, VStack } from '@suite-native/atoms';

import { TransactionListHeader } from '../components/TransactionListHeader';
import { AccountDetailScreenHeader } from '../components/AccountDetailScreenHeader';
import { TokenAccountDetailScreenSubHeader } from '../components/TokenAccountDetailScreenSubHeader';

const SCREEN_WIDTH = Dimensions.get('window').width;

const cardStyle = prepareNativeStyle(utils => ({
    padding: utils.spacings.small,
}));

const LoadingAccountDetailScreen = () => {
    const { applyStyle } = useNativeStyles();

    return (
        <Screen screenHeader={<ScreenSubHeader />}>
            <VStack spacing="extraLarge" alignItems="center">
                <Card style={applyStyle(cardStyle)}>
                    <BoxSkeleton width={SCREEN_WIDTH - 32} height={70} />
                </Card>
                <Card style={applyStyle(cardStyle)}>
                    <VStack spacing="large" alignItems="center" paddingHorizontal="large">
                        <BoxSkeleton width={104} height={104} borderRadius={52} />
                        <BoxSkeleton width={160} height={30} />
                        <BoxSkeleton width={200} height={24} />
                        <BoxSkeleton width={SCREEN_WIDTH - 80} height={48} borderRadius={24} />
                    </VStack>
                </Card>
            </VStack>
        </Screen>
    );
};

export const AccountDetailScreen = memo(() => {
    const route = useRoute<RouteProp<RootStackParamList, RootStackRoutes.AccountDetail>>();
    const {
        accountKey: routeAccountKey,
        tokenContract,
        networkSymbol,
        accountType,
        accountIndex,
    } = route.params;

    const dispatch = useDispatch();

    const [areTokensIncluded, setAreTokensIncluded] = useState(false);

    const foundAccountKey = useSelector((state: AccountsRootState & DeviceRootState) =>
        selectDeviceAccountsForNetworkSymbolAndAccountTypeWithIndex(
            state,
            networkSymbol,
            accountType,
            accountIndex,
        ),
    )?.key;

    const accountKey = routeAccountKey ?? foundAccountKey;

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
        () =>
            accountKey ? (
                <TransactionListHeader
                    accountKey={accountKey}
                    tokenContract={tokenContract}
                    areTokensIncluded={areTokensIncluded}
                    toggleIncludeTokenTransactions={toggleIncludeTokenTransactions}
                />
            ) : null,
        [accountKey, tokenContract, areTokensIncluded, toggleIncludeTokenTransactions],
    );

    return !account || !listHeaderComponent || !accountKey ? (
        <LoadingAccountDetailScreen />
    ) : (
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
});
