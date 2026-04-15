import { memo } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectIsPortfolioTrackerDevice } from '@suite-common/device';
import {
    type AccountsRootState,
    type TransactionsRootState,
    selectAccountByKey,
    selectIsTestnetAccount,
    useDisplayBaseCurrency,
} from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { events } from '@suite-native/analytics';
import { Box, Button, HStack, Text, VStack } from '@suite-native/atoms';
import { selectHasFirmwareAuthenticityCheckHardFailedForSelectedDevice } from '@suite-native/device';
import { type FeatureFlagsRootState } from '@suite-native/feature-flags';
import { Translation } from '@suite-native/intl';
import {
    ReceiveStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    SendStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { useAnalytics } from '@suite-native/services';
import { type TokensRootState, selectAccountTokenInfo } from '@suite-native/tokens';
import { selectHasAccountAnyTransactions } from '@suite-native/transactions';

import { selectIsNetworkSendFlowEnabled } from '../selectors';
import { SolanaLimitedHistoryBanner } from './AccountBanners/SolanaLimitedHistoryBanner';
import { StellarLimitedHistoryBanner } from './AccountBanners/StellarLimitedHistoryBanner';
import { AccountDetailCryptoValue } from './AccountDetailCryptoValue';
import { AccountDetailGraph } from './AccountDetailGraph';
import { CoinPriceCard } from './CoinPriceCard';
import { StablecoinYieldTokenOverview } from './StablecoinYieldTokenOverview';
import { StellarTokenActions } from './StellarTokenActions';
import { TronResources } from './TronResources';

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
        const analytics = useAnalytics();
        const navigation = useNavigation<NavigationProp>();

        const account = useSelector((state: AccountsRootState) =>
            selectAccountByKey(state, accountKey),
        );
        const { shallDisplayBaseCurrency } = useDisplayBaseCurrency(account?.symbol);

        const hasAccountTransactions = useSelector(
            (state: TransactionsRootState & TokensRootState) =>
                selectHasAccountAnyTransactions(state, accountKey),
        );
        const isNetworkSendFlowEnabled = useSelector((state: FeatureFlagsRootState) =>
            selectIsNetworkSendFlowEnabled(state, account?.symbol),
        );
        const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);
        const hasFirmwareAuthenticityCheckHardFailed = useSelector(
            selectHasFirmwareAuthenticityCheckHardFailedForSelectedDevice,
        );
        const token = useSelector((state: TokensRootState) =>
            selectAccountTokenInfo(state, accountKey, tokenContract),
        );

        if (!account) return null;

        const handleReceive = () => {
            analytics.report({
                type: events.receiveFlowEnteredEvent.name,
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
                type: events.sendFlowEnteredEvent.name,
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
        const isPriceCardDisplayed = shallDisplayBaseCurrency && !isTokenDetail;
        const isStellarAccount = account.networkType === 'stellar';

        const isSendButtonDisplayed = isNetworkSendFlowEnabled && !isPortfolioTrackerDevice;
        const isReceiveButtonDisplayed = !hasFirmwareAuthenticityCheckHardFailed;
        const isStellarTokenActionsDisplayed = isStellarAccount && !isPortfolioTrackerDevice;

        return (
            <>
                <VStack spacing="sp24">
                    <TransactionListHeaderContent
                        accountKey={accountKey}
                        tokenContract={tokenContract}
                    />
                    {tokenContract && (
                        <StablecoinYieldTokenOverview
                            accountKey={accountKey}
                            tokenContract={tokenContract}
                        />
                    )}
                    {hasAccountTransactions && (
                        <HStack paddingTop="sp8" paddingHorizontal="sp16" flex={1} spacing="sp12">
                            {isReceiveButtonDisplayed && (
                                <Box flex={1}>
                                    <Button
                                        iconLeft="arrowLineDown"
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
                                        iconLeft="arrowLineUp"
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
                    {isStellarTokenActionsDisplayed && (
                        <StellarTokenActions
                            accountKey={accountKey}
                            tokenContract={tokenContract}
                        />
                    )}
                    {isStellarAccount && <StellarLimitedHistoryBanner />}
                    {account.networkType === 'solana' && <SolanaLimitedHistoryBanner />}
                    {account.networkType === 'tron' && !tokenContract && hasAccountTransactions && (
                        <TronResources accountKey={accountKey} />
                    )}
                </VStack>
                {hasAccountTransactions && (
                    <Box marginTop="sp52" marginHorizontal="sp16">
                        <Text variant="headline-sm">
                            <Translation id="transactions.title" />
                        </Text>
                    </Box>
                )}
            </>
        );
    },
);
