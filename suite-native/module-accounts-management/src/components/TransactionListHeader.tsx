import { memo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { ThunkDispatch, UnknownAction, isFulfilled } from '@reduxjs/toolkit';

import {
    AccountsRootState,
    TransactionsRootState,
    selectAccountByKey,
    selectIsPortfolioTrackerDevice,
    selectIsTestnetAccount,
    useDisplayBaseCurrency,
} from '@suite-common/wallet-core';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { isZero } from '@suite-common/wallet-utils';
import { useAlert } from '@suite-native/alerts';
import { EventType } from '@suite-native/analytics';
import { Box, Button, HStack, Text, VStack } from '@suite-native/atoms';
import { selectHasFirmwareAuthenticityCheckHardFailed } from '@suite-native/device';
import { FeatureFlagsRootState } from '@suite-native/feature-flags';
import { Translation, useTranslate } from '@suite-native/intl';
import { composeStellarTrustlineFeesThunk } from '@suite-native/module-stellar-token-management';
import {
    ReceiveStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    SendStackRoutes,
    StackNavigationProps,
    StellarManageTokenStackRoutes,
} from '@suite-native/navigation';
import { useAnalytics } from '@suite-native/services';
import {
    TokensRootState,
    selectAccountTokenBalance,
    selectAccountTokenInfo,
} from '@suite-native/tokens';
import { selectHasAccountAnyTransactions } from '@suite-native/transactions';

import { selectIsNetworkSendFlowEnabled } from '../selectors';
import { SolanaLimitedHistoryBanner } from './AccountBanners/SolanaLimitedHistoryBanner';
import { StellarLimitedHistoryBanner } from './AccountBanners/StellarLimitedHistoryBanner';
import { AccountDetailCryptoValue } from './AccountDetailCryptoValue';
import { AccountDetailGraph } from './AccountDetailGraph';
import { CoinPriceCard } from './CoinPriceCard';

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
        const { showAlert } = useAlert();
        const { translate } = useTranslate();
        const dispatch = useDispatch<ThunkDispatch<any, any, UnknownAction>>();

        const [isComposingFees, setIsComposingFees] = useState(false);

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
            selectHasFirmwareAuthenticityCheckHardFailed,
        );
        const token = useSelector((state: TokensRootState) =>
            selectAccountTokenInfo(state, accountKey, tokenContract),
        );
        const tokenBalance = useSelector((state: TokensRootState) =>
            selectAccountTokenBalance(state, accountKey, tokenContract),
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

        const handleActivateToken = () => {
            navigation.navigate(RootStackRoutes.StellarManageTokenStack, {
                screen: StellarManageTokenStackRoutes.TokenSelection,
                params: {
                    accountKey,
                },
            });
        };

        const handleDeactivateToken = async () => {
            // Check if token has balance > 0
            const hasBalance = !isZero(tokenBalance ?? '0');
            if (hasBalance) {
                showAlert({
                    title: translate('moduleStellarToken.deactivationFee.cantDeactivateTitle'),
                    description: translate(
                        'moduleStellarToken.deactivationFee.cantDeactivateDescription',
                    ),
                    primaryButtonTitle: translate('generic.buttons.gotIt'),
                });

                return;
            }

            setIsComposingFees(true);
            try {
                // Compose fee levels BEFORE navigating (like trading module)
                const result = await dispatch(
                    composeStellarTrustlineFeesThunk({
                        accountKey,
                        tokenContract: tokenContract!,
                    }),
                );

                if (isFulfilled(result)) {
                    navigation.navigate(RootStackRoutes.StellarManageTokenStack, {
                        screen: StellarManageTokenStackRoutes.DeactivationFee,
                        params: {
                            accountKey,
                            tokenContract: tokenContract!,
                        },
                    });
                } else {
                    // Show error when fee composition fails (e.g., offline/slow fetch)
                    showAlert({
                        title: translate('moduleStellarToken.deactivationFee.deactivationFailed'),
                        description: translate(
                            'moduleStellarToken.deactivationFee.deactivationFailedDescription',
                        ),
                        primaryButtonTitle: translate('generic.buttons.gotIt'),
                    });
                }
            } finally {
                setIsComposingFees(false);
            }
        };

        const isTokenDetail = !!tokenContract;
        const isPriceCardDisplayed = shallDisplayBaseCurrency && !isTokenDetail;

        const isSendButtonDisplayed = isNetworkSendFlowEnabled && !isPortfolioTrackerDevice;
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
                    {account.networkType === 'stellar' &&
                        !isTokenDetail &&
                        !isPortfolioTrackerDevice && (
                            <Box paddingHorizontal="sp16">
                                <Button
                                    colorScheme="tertiaryElevation0"
                                    viewLeft="plus"
                                    onPress={handleActivateToken}
                                    testID="@account-detail/activate-token-button"
                                >
                                    <Translation id="moduleStellarToken.accountDetail.activateToken" />
                                </Button>
                            </Box>
                        )}
                    {account.networkType === 'stellar' &&
                        isTokenDetail &&
                        !isPortfolioTrackerDevice && (
                            <Box paddingHorizontal="sp16">
                                <Button
                                    colorScheme="tertiaryElevation0"
                                    onPress={handleDeactivateToken}
                                    isLoading={isComposingFees}
                                    isDisabled={isComposingFees}
                                    testID="@account-detail/deactivate-token-button"
                                >
                                    <Translation id="moduleStellarToken.accountDetail.deactivateToken" />
                                </Button>
                            </Box>
                        )}
                    {account.networkType === 'stellar' && <StellarLimitedHistoryBanner />}
                    {account.networkType === 'solana' && <SolanaLimitedHistoryBanner />}
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
