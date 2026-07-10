import { useCallback } from 'react';

import { useNavigation } from '@react-navigation/native';

import { getConvertedOutputTokenBalanceToInputTokenAmount } from '@suite-common/wallet-core';
import {
    type AccountKey,
    type TokenAddress,
    toTokenAddress,
    toTokenSymbol,
} from '@suite-common/wallet-types';
import { isApyAvailable } from '@suite-common/wallet-utils';
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
import { TokenAmountFormatter } from '@suite-native/formatters';
import { CryptoIconWithNetwork, Icon } from '@suite-native/icons';
import { Translation, useTranslate } from '@suite-native/intl';
import {
    StablecoinYieldApyBreakdown,
    useResolvedYieldFlowData,
    useStablecoinYieldFirmwareUpdateAlert,
} from '@suite-native/module-earn';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
    YieldStackRoutes,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const abbrStyle = prepareNativeStyle(() => ({
    borderStyle: 'dotted',
    borderBottomWidth: 1,
}));

type StablecoinYieldTokenOverviewProps = {
    accountKey: AccountKey;
    tokenContract: TokenAddress;
};

type NavigationProps = StackNavigationProps<RootStackParamList, RootStackRoutes.AccountDetail>;

export const StablecoinYieldTokenOverview = ({
    accountKey,
    tokenContract,
}: StablecoinYieldTokenOverviewProps) => {
    const navigation = useNavigation<NavigationProps>();
    const { showAlert } = useAlert();
    const { translate } = useTranslate();
    const { applyStyle } = useNativeStyles();
    const { isFirmwareSupported, showFirmwareUpdateAlert } =
        useStablecoinYieldFirmwareUpdateAlert();
    const { account, apy, resolutionStatus, depositedSharesAmount, vault } =
        useResolvedYieldFlowData({
            accountKey,
            tokenContract,
            displayError: false,
        });
    const apyValueText = apy && isApyAvailable(apy) ? `~${apy.toFixed(2)}%` : null;

    const handleOpenApyAlert = useCallback(() => {
        if (!account || !vault) {
            return;
        }

        showAlert({
            title: vault.outputToken?.name ?? '',
            description: translate(
                'moduleAccounts.accountDetail.stablecoinYield.apyBreakdown.apyLabel',
                { apy: apyValueText },
            ),
            appendix: (
                <StablecoinYieldApyBreakdown
                    networkSymbol={account.symbol}
                    rewards={vault.rewardRate.components}
                    underlyingToken={vault.token}
                    tokenSymbol={vault.token.symbol}
                />
            ),
            textAlign: 'center',
            titleSpacing: 'sp4',
            primaryButtonTitle: translate('generic.buttons.close'),
            testID: '@account-detail/stablecoin-yield/apy-breakdown-alert',
        });
    }, [account, apyValueText, showAlert, translate, vault]);

    const handleDepositMorePress = useCallback(() => {
        if (!vault?.token.address) {
            return;
        }

        if (!isFirmwareSupported('deposit')) {
            showFirmwareUpdateAlert();

            return;
        }

        const underlyingTokenContract = toTokenAddress(vault.token.address);

        navigation.navigate(RootStackRoutes.YieldNavigator, {
            screen: YieldStackRoutes.HowYieldWorks,
            params: {
                accountKey,
                tokenContract: underlyingTokenContract,
                yieldId: vault.id,
            },
        });
    }, [accountKey, isFirmwareSupported, navigation, showFirmwareUpdateAlert, vault]);

    const handleWithdrawPress = useCallback(() => {
        if (!isFirmwareSupported('withdraw')) {
            showFirmwareUpdateAlert();

            return;
        }

        navigation.navigate(RootStackRoutes.YieldNavigator, {
            screen: YieldStackRoutes.YieldWithdraw,
            params: {
                accountKey,
                tokenContract,
            },
        });
    }, [accountKey, isFirmwareSupported, navigation, showFirmwareUpdateAlert, tokenContract]);

    if (resolutionStatus !== 'resolved' || !vault?.token.address) return null;

    const apyColor = apyValueText === null ? 'contentSecondary' : 'contentPrimary';
    const apyValue = apyValueText ?? <Translation id="earn.notAvailableShort" />;
    const depositedPosition =
        account && depositedSharesAmount !== null
            ? {
                  balance: getConvertedOutputTokenBalanceToInputTokenAmount({
                      networkSymbol: account.symbol,
                      token: vault.token,
                      outputToken: vault.outputToken,
                      outputTokenBalance: depositedSharesAmount,
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
                        <Text variant="body-sm">{vault.outputToken?.name ?? ''}</Text>
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
                            <Text variant="body-sm" color={apyColor} style={applyStyle(abbrStyle)}>
                                {apyValue}
                            </Text>
                        </HStack>
                    </PressableOpacity>
                    <CardDivider />
                    <HStack justifyContent="space-between" alignItems="center">
                        <Text variant="body-sm" color="contentSecondary">
                            <Translation id="moduleAccounts.accountDetail.stablecoinYield.deposited" />
                        </Text>
                        {depositedPosition && (
                            <HStack alignItems="center" spacing="sp8">
                                <CryptoIconWithNetwork
                                    symbol={depositedPosition.symbol}
                                    contractAddress={depositedPosition.contractAddress}
                                    size="extraSmall"
                                />
                                <TokenAmountFormatter
                                    value={depositedPosition.balance}
                                    tokenSymbol={depositedPosition.tokenSymbol}
                                    color="contentPrimary"
                                    variant="body-sm"
                                />
                            </HStack>
                        )}
                    </HStack>
                    {depositedPosition && (
                        <HStack spacing="sp12">
                            <Box flex={1}>
                                <Button
                                    onPress={handleDepositMorePress}
                                    intent="brand"
                                    priority="secondary"
                                    size="medium"
                                    testID="@account-detail/stablecoin-yield/deposit-more-button"
                                >
                                    <Translation id="moduleAccounts.accountDetail.stablecoinYield.depositMore" />
                                </Button>
                            </Box>
                            <Box flex={1}>
                                <Button
                                    onPress={handleWithdrawPress}
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
