import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { useAllYieldOpportunities } from '@suite-common/earn-stablecoin-api';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress, type TokenSymbol } from '@suite-common/wallet-types';
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
import { type TokensRootState, selectAccountTokenInfo } from '@suite-native/tokens';

import { StablecoinYieldApyBreakdown } from './StablecoinYieldApyBreakdown';
import { getApyPercent } from '../utils';

type StablecoinYieldTokenOverviewProps = {
    accountKey: AccountKey;
    tokenContract: TokenAddress;
};

export const StablecoinYieldTokenOverview = ({
    accountKey,
    tokenContract,
}: StablecoinYieldTokenOverviewProps) => {
    const { showAlert } = useAlert();
    const { translate } = useTranslate();
    const isEnabled = useFeatureFlag(FeatureFlag.IsStablecoinYieldEnabled);
    const { yieldOpportunities } = useAllYieldOpportunities({ enabled: isEnabled });
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const token = useSelector((state: TokensRootState) =>
        selectAccountTokenInfo(state, accountKey, tokenContract),
    );

    const vault = useMemo(() => {
        const normalizedContract = tokenContract.toLowerCase();

        return yieldOpportunities.find(v => v.token.address?.toLowerCase() === normalizedContract);
    }, [yieldOpportunities, tokenContract]);

    const apyPercent =
        vault?.rewardRate.total != null ? getApyPercent(vault.rewardRate.total)?.toFixed(2) : null;
    const apy = apyPercent !== null ? `~${apyPercent}%` : null;

    const handleShowWipAlert = useCallback(
        () =>
            showAlert({
                title: 'Work in progress',
                description: 'This action is not available yet.',
                primaryButtonTitle: translate('generic.buttons.gotIt'),
            }),
        [showAlert, translate],
    );

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
                { apy },
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
    }, [account, apy, showAlert, translate, vault]);

    if (!isEnabled || !vault) return null;

    const apyColor = apy === null ? 'contentSecondary' : 'contentPrimary';
    const apyValue = apy ?? <Translation id="earn.notAvailable" />;
    const hasSuppliedValue = !!account && !!token;
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
                        {hasSuppliedValue && (
                            <HStack alignItems="center" spacing="sp8">
                                <CryptoIconWithNetwork
                                    symbol={account.symbol}
                                    contractAddress={tokenContract}
                                    size="extraSmall"
                                />
                                <TokenAmountFormatter
                                    value={token.balance ?? '0'}
                                    tokenSymbol={token.symbol as TokenSymbol}
                                    color="contentPrimary"
                                    variant="body-sm"
                                />
                            </HStack>
                        )}
                    </HStack>
                    {hasSuppliedValue && (
                        <HStack spacing="sp12">
                            <Box flex={1}>
                                <Button
                                    onPress={handleShowWipAlert}
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
                                    onPress={handleShowWipAlert}
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
