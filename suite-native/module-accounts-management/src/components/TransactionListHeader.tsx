import { memo } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    AccountsRootState,
    TransactionsRootState,
    selectAccountByKey,
    selectIsPortfolioTrackerDevice,
    selectIsTestnetAccount,
} from '@suite-common/wallet-core';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { EventType, analytics } from '@suite-native/analytics';
import { Box, Button, HStack, Text, VStack } from '@suite-native/atoms';
import { selectHasFirmwareAuthenticityCheckHardFailed } from '@suite-native/device';
import { FeatureFlag, FeatureFlagsRootState, useFeatureFlag } from '@suite-native/feature-flags';
import { Translation } from '@suite-native/intl';
import {
    ReceiveStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    SendStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { TokensRootState, selectAccountTokenInfo } from '@suite-native/tokens';
import { selectHasAccountAnyTransactions } from '@suite-native/transactions';

import { AccountDetailCryptoValue } from './AccountDetailCryptoValue';
import { AccountDetailGraph } from './AccountDetailGraph';
import { CoinPriceCard } from './CoinPriceCard';
import { selectIsNetworkSendFlowEnabled } from '../selectors';
import { StellarLimitedHistoryBanner } from './AccountBanners/StellarLimitedHistoryBanner';

type TransactionListHeaderProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
};

type TransactionListHeaderContentProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
};

type NavigationProp = StackNavigationProps<RootStackParamList, RootStackRoutes.AccountDetail>;

const TransactionListHeaderContent = ({
    accountKey,
    tokenContract,
}: TransactionListHeaderContentProps) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const hasAccountTransactions = useSelector((state: TransactionsRootState & TokensRootState) =>
        selectHasAccountAnyTransactions(state, accountKey),
    );
    const isTestnetAccount = useSelector((state: AccountsRootState) =>
        selectIsTestnetAccount(state, accountKey),
    );

    if (!account) return null;

    const isTokenAccount = !!tokenContract;

    // Graph is temporarily hidden also for ERC20 tokens.
    // Will be solved in issue: https://github.com/trezor/trezor-suite/issues/7839
    const isGraphDisplayed = hasAccountTransactions && !isTestnetAccount && !isTokenAccount;

    if (isGraphDisplayed) {
        return <AccountDetailGraph accountKey={accountKey} />;
    }
    if (isTokenAccount) {
        return <AccountDetailGraph accountKey={accountKey} tokenContract={tokenContract} />;
    }

    if (isTestnetAccount) {
        return (
            <AccountDetailCryptoValue value={account.formattedBalance} symbol={account.symbol} />
        );
    }

    return null;
};

export const TransactionListHeader = memo(
    ({ accountKey, tokenContract }: TransactionListHeaderProps) => {
        const navigation = useNavigation<NavigationProp>();
        const isDeviceConnectEnabled = useFeatureFlag(FeatureFlag.IsDeviceConnectEnabled);

        const account = useSelector((state: AccountsRootState) =>
            selectAccountByKey(state, accountKey),
        );

        const hasAccountTransactions = useSelector(
            (state: TransactionsRootState & TokensRootState) =>
                selectHasAccountAnyTransactions(state, accountKey),
        );
        const isTestnetAccount = useSelector((state: AccountsRootState) =>
            selectIsTestnetAccount(state, accountKey),
        );
        const isNetworkSendFlowEnabled = useSelector((state: FeatureFlagsRootState) =>
            selectIsNetworkSendFlowEnabled(state, account?.symbol),
        );
        const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);
        const hasFirmwareAuthenticityCheckHardFailed = useSelector(
            selectHasFirmwareAuthenticityCheckHardFailed,
        );
        const token = useSelector((state: TokensRootState) =>
            selectAccountTokenInfo(state, accountKey, tokenContract),
        );

        if (!account) return null;

        const handleReceive = () => {
            analytics.report({
                type: EventType.ReceiveFlowEntered,
                payload: {
                    location: 'accountDetail',
                    assetSymbol: account.symbol,
                    tokenSymbol: token?.symbol,
                    tokenContract,
                },
            });
            navigation.navigate(RootStackRoutes.ReceiveStack, {
                screen: ReceiveStackRoutes.ReceiveAccount,
                params: {
                    accountKey,
                    tokenContract,
                    closeActionType: 'close',
                },
            });
        };

        const handleSend = () => {
            analytics.report({
                type: EventType.SendFlowEntered,
                payload: {
                    location: 'accountDetail',
                    assetSymbol: account.symbol,
                    tokenSymbol: token?.symbol,
                    tokenContract,
                },
            });
            navigation.navigate(RootStackRoutes.SendStack, {
                screen: SendStackRoutes.SendOutputs,
                params: {
                    accountKey,
                    tokenContract,
                },
            });
        };

        const isTokenDetail = !!tokenContract;
        const isPriceCardDisplayed = !isTestnetAccount && !isTokenDetail;

        const isSendButtonDisplayed =
            isDeviceConnectEnabled && isNetworkSendFlowEnabled && !isPortfolioTrackerDevice;
        const isReceiveButtonDisplayed = !hasFirmwareAuthenticityCheckHardFailed;

        return (
            <>
                <VStack spacing="sp24">
                    <TransactionListHeaderContent
                        accountKey={accountKey}
                        tokenContract={tokenContract}
                    />
                    {hasAccountTransactions && (
                        <HStack paddingTop="sp8" paddingHorizontal="sp16" flex={1} spacing="sp12">
                            {isReceiveButtonDisplayed && (
                                <Box flex={1}>
                                    <Button
                                        viewLeft="arrowLineDown"
                                        onPress={handleReceive}
                                        testID="@account-detail/receive-button"
                                    >
                                        <Translation id="transactions.receive" />
                                    </Button>
                                </Box>
                            )}
                            {isSendButtonDisplayed && (
                                <Box flex={1}>
                                    <Button
                                        viewLeft="arrowLineUp"
                                        onPress={handleSend}
                                        testID="@account-detail/send-button"
                                    >
                                        <Translation id="transactions.send" />
                                    </Button>
                                </Box>
                            )}
                        </HStack>
                    )}
                    {isPriceCardDisplayed && <CoinPriceCard accountKey={accountKey} />}
                    {account.networkType === 'stellar' && <StellarLimitedHistoryBanner />}
                </VStack>
                {hasAccountTransactions && (
                    <Box marginTop="sp52" marginHorizontal="sp32">
                        <Text variant="titleSmall">
                            <Translation id="transactions.title" />
                        </Text>
                    </Box>
                )}
            </>
        );
    },
);
