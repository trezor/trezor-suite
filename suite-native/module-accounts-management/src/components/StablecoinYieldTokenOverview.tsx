import { useCallback } from 'react';

import { useNavigation } from '@react-navigation/native';

import { getConvertedOutputTokenBalanceToInputTokenAmount } from '@suite-common/wallet-core';
import {
    type AccountKey,
    type TokenAddress,
    toTokenAddress,
    toTokenSymbol,
} from '@suite-common/wallet-types';
import { useAlert } from '@suite-native/alerts';
import {
    Box,
    Button,
    Card,
    CardDivider,
    HStack,
    PressableOpacity,
    Text,
    VStack,
} from '@suite-native/atoms';
import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';
import { TokenAmountFormatter } from '@suite-native/formatters';
import { CryptoIconWithNetwork, Icon } from '@suite-native/icons';
import { Translation, useTranslate } from '@suite-native/intl';
import { useResolvedYieldFlowData, useWorkInProgressAlert } from '@suite-native/module-earn';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
    YieldStackRoutes,
} from '@suite-native/navigation';

import { StablecoinYieldApyBreakdown } from './StablecoinYieldApyBreakdown';

type StablecoinYieldTokenOverviewProps = {
    accountKey: AccountKey;
    tokenContract: TokenAddress;
};

type NavigationProps = StackNavigationProps<RootStackParamList, RootStackRoutes.AccountDetail>;

export const StablecoinYieldTokenOverview = ({
    accountKey,
    tokenContract,
}: StablecoinYieldTokenOverviewProps) => {
    const handleShowWithdrawWorkInProgressAlert = useWorkInProgressAlert();
    const navigation = useNavigation<NavigationProps>();
    const { showAlert } = useAlert();
    const { translate } = useTranslate();
    const isEnabled = useFeatureFlag(FeatureFlag.IsStablecoinYieldEnabled);
    const { account, apy, resolutionStatus, token, vault } = useResolvedYieldFlowData({
        accountKey,
        tokenContract,
        displayError: false,
    });
    const apyValueText = apy !== null ? `~${apy.toFixed(2)}%` : null;

    const handleOpenApyAlert = useCallback(() => {
        if (!account || !vault) {
            return;
        }

        showAlert({
            title: vault.outputToken?.name ? (
                <Translation id="earn.vaultName" values={{ vaultName: vault.outputToken.name }} />
            ) : (
                ''
            ),
            description: translate(
                'moduleAccounts.accountDetail.stablecoinYield.apyBreakdown.apyLabel',
                { apy: apyValueText },
            ),
            appendix: (
                <StablecoinYieldApyBreakdown
                    networkSymbol={account.symbol}
                    rewards={vault.rewardRate.components}
                />
            ),
            textAlign: 'center',
            titleSpacing: 'sp4',
            primaryButtonTitle: translate('generic.buttons.close'),
            testID: '@account-detail/stablecoin-yield/apy-breakdown-alert',
        });
    }, [account, apyValueText, showAlert, translate, vault]);

    const handleSupplyMorePress = useCallback(() => {
        if (!vault?.token.address) {
            return;
        }

        navigation.navigate(RootStackRoutes.YieldNavigator, {
            screen: YieldStackRoutes.HowYieldWorks,
            params: {
                accountKey,
                tokenContract,
            },
        });
    }, [accountKey, navigation, tokenContract, vault?.token.address]);

    if (!isEnabled || resolutionStatus !== 'resolved' || !vault?.token.address) return null;

    const apyColor = apyValueText === null ? 'contentSecondary' : 'contentPrimary';
    const apyValue = apyValueText ?? <Translation id="earn.notAvailable" />;
    const suppliedPosition =
        account && token?.balance !== undefined
            ? {
                  balance: getConvertedOutputTokenBalanceToInputTokenAmount({
                      networkSymbol: account.symbol,
                      token: vault.token,
                      outputToken: vault.outputToken,
                      outputTokenBalance: token.balance,
                      pricePerShareState: vault.state?.pricePerShareState,
                  }),
                  contractAddress: toTokenAddress(vault.token.address),
                  symbol: account.symbol,
                  tokenSymbol: toTokenSymbol(vault.token.symbol.toUpperCase()),
              }
            : null;
    const hasApyBreakdown = vault.rewardRate.components.length > 0;
    const isApyRowDisabled = apy === null || !hasApyBreakdown || !account;

    return (
        <Box marginHorizontal="sp16">
            <Card>
                <VStack spacing="sp16">
                    <HStack spacing="sp10">
                        <Icon name="info" size="mediumLarge" />
                        <Box flex={1}>
                            <Text variant="body-sm-strong">
                                <Translation id="moduleAccounts.accountDetail.stablecoinYield.infoText" />
                            </Text>
                        </Box>
                    </HStack>
                    <CardDivider />
                    <HStack justifyContent="space-between" alignItems="center">
                        <Text variant="body-sm" color="contentSecondary">
                            <Translation id="moduleAccounts.accountDetail.stablecoinYield.vault" />
                        </Text>
                        <Text variant="body-sm">
                            {vault.outputToken?.name ? (
                                <Translation
                                    id="earn.vaultName"
                                    values={{ vaultName: vault.outputToken.name }}
                                />
                            ) : (
                                ''
                            )}
                        </Text>
                    </HStack>
                    <CardDivider />
                    <PressableOpacity
                        onPress={handleOpenApyAlert}
                        disabled={isApyRowDisabled}
                        testID="@account-detail/stablecoin-yield/apy-row"
                    >
                        <HStack justifyContent="space-between" alignItems="center">
                            <Text variant="body-sm" color="contentSecondary">
                                <Translation id="moduleAccounts.accountDetail.stablecoinYield.apy" />
                            </Text>
                            <Text variant="body-sm" color={apyColor}>
                                {apyValue}
                            </Text>
                        </HStack>
                    </PressableOpacity>
                    <CardDivider />
                    <HStack justifyContent="space-between" alignItems="center">
                        <Text variant="body-sm" color="contentSecondary">
                            <Translation id="moduleAccounts.accountDetail.stablecoinYield.supplied" />
                        </Text>
                        {suppliedPosition && (
                            <HStack alignItems="center" spacing="sp8">
                                <CryptoIconWithNetwork
                                    symbol={suppliedPosition.symbol}
                                    contractAddress={suppliedPosition.contractAddress}
                                    size="extraSmall"
                                />
                                <TokenAmountFormatter
                                    value={suppliedPosition.balance}
                                    tokenSymbol={suppliedPosition.tokenSymbol}
                                    color="contentPrimary"
                                    variant="body-sm"
                                />
                            </HStack>
                        )}
                    </HStack>
                    {suppliedPosition && (
                        <HStack spacing="sp12">
                            <Box flex={1}>
                                <Button
                                    onPress={handleSupplyMorePress}
                                    intent="brand"
                                    priority="secondary"
                                    size="medium"
                                    testID="@account-detail/stablecoin-yield/supply-more-button"
                                >
                                    <Translation id="moduleAccounts.accountDetail.stablecoinYield.supplyMore" />
                                </Button>
                            </Box>
                            <Box flex={1}>
                                <Button
                                    // TODO: Remove once the stablecoin yield withdraw flow is implemented.
                                    onPress={handleShowWithdrawWorkInProgressAlert}
                                    intent="brand"
                                    priority="secondary"
                                    size="medium"
                                    testID="@account-detail/stablecoin-yield/withdraw-button"
                                >
                                    <Translation id="moduleAccounts.accountDetail.stablecoinYield.withdraw" />
                                </Button>
                            </Box>
                        </HStack>
                    )}
                </VStack>
            </Card>
        </Box>
    );
};
