import { useCallback, useMemo } from 'react';

import { useNavigation } from '@react-navigation/native';

import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { useFormatters } from '@suite-common/formatters';
import {
    getConvertedOutputTokenBalanceToInputTokenAmount,
    getYieldDepositableBalance,
} from '@suite-common/wallet-core';
import {
    type Account,
    type TokenInfoBranded,
    toTokenAddress,
    toTokenSymbol,
} from '@suite-common/wallet-types';
import { isApyAvailable } from '@suite-common/wallet-utils';
import { selectNativeAnalyticsDep } from '@suite-native/analytics';
import { Box, Button, Card, HStack, Text, VStack } from '@suite-native/atoms';
import { TokenAmountFormatter, TokenToFiatAmountFormatter } from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
    YieldStackRoutes,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { BigNumber } from '@trezor/utils';

import { ApyDottedUnderline } from '../components/ApyDottedUnderline';
import { useApyBreakdownAlert } from '../hooks/useApyBreakdownAlert';
import { useStablecoinYieldFirmwareUpdateAlert } from '../hooks/useStablecoinYieldFirmwareUpdateAlert';
import { useYieldFlowData } from '../hooks/useYieldFlowData';

const stakedSectionStyle = prepareNativeStyle(utils => ({
    padding: utils.spacings.sp16,
}));

const stakedSectionStyleWithBorder = prepareNativeStyle(utils => ({
    padding: utils.spacings.sp16,
    borderBottomWidth: utils.borders.widths.small,
    borderBottomColor: utils.colors.borderNeutral,
}));

type NavigationProps = StackNavigationProps<RootStackParamList, RootStackRoutes.AccountDetail>;

interface YieldVaultDetailScreenContentProps {
    account: Account;
    yieldToken: TokenInfoBranded;
}

export const YieldVaultDetailScreenContent = ({
    account,
    yieldToken,
}: YieldVaultDetailScreenContentProps) => {
    const { applyStyle } = useNativeStyles();
    const navigation = useNavigation<NavigationProps>();
    const { analytics } = useServices(selectNativeAnalyticsDep);

    const { CryptoAmountFormatter: cryptoAmountFormatter } = useFormatters();
    const { isFirmwareSupported, showFirmwareUpdateAlert } =
        useStablecoinYieldFirmwareUpdateAlert();

    const yieldFlowData = useYieldFlowData({
        accountKey: account.key,
        tokenContract: yieldToken.contract,
    });

    const {
        vault,
        apy,
        depositedSharesAmount,
        token,
        wrappedNativeSymbol,
        bonusRewardTokenSymbol,
    } = yieldFlowData;

    const apyValue = apy && isApyAvailable(apy) ? apy.toFixed(2) : null;

    const apyBreakdownAlert = useApyBreakdownAlert({ account, vault });

    const depositedPosition = useMemo(() => {
        if (depositedSharesAmount === null || !vault || !token?.contractAddress) {
            return null;
        }

        return {
            symbol: account.symbol,
            tokenSymbol: toTokenSymbol(vault.token.symbol),
            contractAddress: toTokenAddress(token.contractAddress),
            balance: getConvertedOutputTokenBalanceToInputTokenAmount({
                networkSymbol: account.symbol,
                token: vault.token,
                outputToken: vault.outputToken,
                outputTokenBalance: depositedSharesAmount,
                pricePerShareState: vault.state?.pricePerShareState,
            }),
            decimals: vault.token.decimals,
        };
    }, [account, depositedSharesAmount, vault, token]);

    const yearlyRewards = useMemo(() => {
        if (!depositedPosition?.balance || !vault?.rewardRate?.total) {
            return null;
        }

        const yearlyRewardsValue = new BigNumber(depositedPosition.balance)
            .times(vault.rewardRate.total)
            .toString();

        const formattedDepositedAmount = cryptoAmountFormatter.format(depositedPosition.balance, {
            symbol: wrappedNativeSymbol
                ? toTokenSymbol(wrappedNativeSymbol)
                : depositedPosition.tokenSymbol,
            withSymbol: true,
            isBalance: true,
        });

        return { yearlyRewards: yearlyRewardsValue, formattedDepositedAmount };
    }, [depositedPosition, wrappedNativeSymbol, cryptoAmountFormatter, vault]);

    const potentialRewards = useMemo(() => {
        if (
            !token?.balance ||
            !depositedPosition?.balance ||
            !depositedPosition?.tokenSymbol ||
            !vault?.rewardRate?.total
        ) {
            return null;
        }

        const additionalDepositAmount = getYieldDepositableBalance({
            networkSymbol: account.symbol,
            nativeFormattedBalance: account.formattedBalance,
            vaultTokenAddress: vault.token.address,
            matchedTokenBalance: token.balance,
        });

        const formattedAdditionalDepositAmount = cryptoAmountFormatter.format(
            additionalDepositAmount,
            {
                symbol: wrappedNativeSymbol
                    ? toTokenSymbol(wrappedNativeSymbol)
                    : depositedPosition.tokenSymbol,
                withSymbol: true,
                isBalance: true,
            },
        );

        const potentialRewardsValue = new BigNumber(depositedPosition.balance)
            .plus(additionalDepositAmount)
            .times(vault.rewardRate.total)
            .toString();

        return {
            potentialRewards: potentialRewardsValue,
            formattedAdditionalDepositAmount,
        };
    }, [account, vault, token, depositedPosition, cryptoAmountFormatter, wrappedNativeSymbol]);

    const onDepositPress = useCallback(() => {
        if (!vault?.token.address) {
            return;
        }

        if (
            !isFirmwareSupported('deposit', {
                networkSymbol: account.symbol,
                contractAddress: vault.token.address,
            })
        ) {
            analytics.report({
                type: events.yieldDepositEvent.name,
                payload: {
                    action: 'continue',
                    type: 'firmware-upgrade-needed-modal',
                    networkSymbol: account?.symbol,
                    vaultId: vault?.id,
                },
            });

            showFirmwareUpdateAlert();

            return;
        }

        const underlyingTokenContract = toTokenAddress(vault.token.address);

        analytics.report({
            type: events.yieldNavigateEvent.name,
            payload: {
                action: 'continue',
                from: 'vault-detail',
                to: 'deposit-in-a-nutshell-modal',
                networkSymbol: account.symbol,
                vaultId: vault?.id,
            },
        });

        navigation.navigate(RootStackRoutes.YieldNavigator, {
            screen: YieldStackRoutes.HowYieldWorks,
            params: {
                accountKey: account.key,
                tokenContract: underlyingTokenContract,
                yieldId: vault.id,
            },
        });
    }, [account, analytics, isFirmwareSupported, navigation, showFirmwareUpdateAlert, vault]);

    const onWithdrawPress = useCallback(() => {
        if (!vault?.token.address) {
            return;
        }

        if (
            !isFirmwareSupported('withdraw', {
                networkSymbol: account.symbol,
                contractAddress: vault.token.address,
            })
        ) {
            analytics.report({
                type: events.yieldWithdrawEvent.name,
                payload: {
                    action: 'continue',
                    type: 'firmware-upgrade-needed-modal',
                    networkSymbol: account.symbol,
                    vaultId: vault?.id,
                },
            });

            showFirmwareUpdateAlert();

            return;
        }

        analytics.report({
            type: events.yieldNavigateEvent.name,
            payload: {
                action: 'continue',
                from: 'vault-detail',
                to: 'withdraw-form',
                networkSymbol: account.symbol,
                vaultId: vault?.id,
            },
        });

        navigation.navigate(RootStackRoutes.YieldNavigator, {
            screen: YieldStackRoutes.YieldWithdraw,
            params: {
                accountKey: account.key,
                tokenContract: yieldToken.contract,
            },
        });
    }, [
        account,
        analytics,
        isFirmwareSupported,
        navigation,
        showFirmwareUpdateAlert,
        yieldToken,
        vault,
    ]);

    return (
        <>
            <VStack spacing="sp16" marginTop="sp16" paddingHorizontal="sp16">
                <Box>
                    <Text variant="headline-sm">{vault?.outputToken?.name ?? ''}</Text>
                </Box>

                <Card noPadding>
                    {account && yieldToken && (
                        <VStack spacing="sp4" style={applyStyle(stakedSectionStyleWithBorder)}>
                            <Text variant="body-md" color="contentSecondary">
                                <Translation id="earn.tokenBalance" />
                            </Text>

                            <TokenAmountFormatter
                                value={yieldToken.balance ?? '0'}
                                tokenSymbol={yieldToken.symbol}
                                color="contentPrimary"
                                variant="headline-sm"
                            />

                            <TokenToFiatAmountFormatter
                                value={yieldToken.balance ?? '0'}
                                symbol={account?.symbol}
                                contract={yieldToken.contract}
                                variant="body-md"
                                color="contentSecondary"
                            />
                        </VStack>
                    )}

                    {yearlyRewards && depositedPosition && (
                        <VStack spacing="sp4" style={applyStyle(stakedSectionStyleWithBorder)}>
                            <Text variant="body-md" color="contentSecondary">
                                <Translation id="earn.yearlyRewards" />
                            </Text>

                            <TokenAmountFormatter
                                value={yearlyRewards.yearlyRewards}
                                tokenSymbol={
                                    wrappedNativeSymbol
                                        ? toTokenSymbol(wrappedNativeSymbol)
                                        : depositedPosition.tokenSymbol
                                }
                                color="contentPrimary"
                                variant="headline-sm"
                            />

                            <Text variant="body-md" color="contentSecondary">
                                <Translation
                                    id="earn.yearlyRewardsDeposited"
                                    values={{
                                        amountWithSymbol: yearlyRewards.formattedDepositedAmount,
                                    }}
                                />
                            </Text>
                        </VStack>
                    )}

                    {potentialRewards && depositedPosition && (
                        <VStack spacing="sp4" style={applyStyle(stakedSectionStyleWithBorder)}>
                            <Text variant="body-md" color="contentSecondary">
                                <Translation id="earn.potentialRewards" />
                            </Text>

                            <TokenAmountFormatter
                                value={potentialRewards.potentialRewards}
                                tokenSymbol={
                                    wrappedNativeSymbol
                                        ? toTokenSymbol(wrappedNativeSymbol)
                                        : depositedPosition.tokenSymbol
                                }
                                color="contentBrand"
                                variant="headline-sm"
                            />

                            <Text variant="body-md" color="contentSecondary">
                                <Translation
                                    id="earn.potentialRewardsIfYouAdd"
                                    values={{
                                        amountWithSymbol:
                                            potentialRewards.formattedAdditionalDepositAmount,
                                    }}
                                />
                            </Text>
                        </VStack>
                    )}

                    <HStack
                        justifyContent="space-between"
                        style={applyStyle(stakedSectionStyleWithBorder)}
                    >
                        {apyValue ? (
                            <ApyDottedUnderline onPress={apyBreakdownAlert.onPress}>
                                <Text variant="body-sm">
                                    <Translation
                                        id={
                                            bonusRewardTokenSymbol
                                                ? 'earn.ratePercentage'
                                                : 'earn.apyPercentage'
                                        }
                                        values={{ apy: apyValue }}
                                    />
                                </Text>
                            </ApyDottedUnderline>
                        ) : (
                            <Text variant="body-sm">
                                <Translation id="earn.apyNotAvailable" />
                            </Text>
                        )}

                        <Text variant="body-sm">
                            <Translation id="earn.rewardsEveryBlock" />
                        </Text>
                    </HStack>

                    <HStack spacing="sp12" style={applyStyle(stakedSectionStyle)}>
                        <Box flex={1}>
                            <Button iconRight="arrowUp" size="medium" onPress={onDepositPress}>
                                <Translation id="moduleAccounts.accountDetail.stablecoinYield.deposit" />
                            </Button>
                        </Box>

                        <Box flex={1}>
                            <Button iconRight="arrowDown" size="medium" onPress={onWithdrawPress}>
                                <Translation id="moduleAccounts.accountDetail.stablecoinYield.withdraw" />
                            </Button>
                        </Box>
                    </HStack>
                </Card>
            </VStack>

            <Box marginTop="sp52" marginHorizontal="sp16">
                <Text variant="headline-sm">
                    <Translation id="transactions.title" />
                </Text>
            </Box>
        </>
    );
};
