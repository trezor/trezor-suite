import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { useAllYieldOpportunities } from '@suite-common/earn-stablecoin-api';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress, type TokenSymbol } from '@suite-common/wallet-types';
import { Box, Card, CardDivider, HStack, Text, VStack } from '@suite-native/atoms';
import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';
import { TokenAmountFormatter } from '@suite-native/formatters';
import { CryptoIconWithNetwork, Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { type TokensRootState, selectAccountTokenInfo } from '@suite-native/tokens';

type StablecoinYieldTokenOverviewProps = {
    accountKey: AccountKey;
    tokenContract: TokenAddress;
};

export const StablecoinYieldTokenOverview = ({
    accountKey,
    tokenContract,
}: StablecoinYieldTokenOverviewProps) => {
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

    if (!isEnabled || !vault) return null;

    const vaultName = vault.outputToken?.name ?? '';
    const apy =
        vault.rewardRate.total != null ? `${(vault.rewardRate.total * 100).toFixed(2)}%` : null;
    const apyColor = apy === null ? 'textSubdued' : 'textDefault';
    const apyValue = apy ?? <Translation id="earn.notAvailable" />;

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
                        <Text variant="body-sm" color="textSubdued">
                            <Translation id="moduleAccounts.accountDetail.stablecoinYield.vault" />
                        </Text>
                        <Text variant="body-sm">{vaultName}</Text>
                    </HStack>
                    <CardDivider />
                    <HStack justifyContent="space-between" alignItems="center">
                        <Text variant="body-sm" color="textSubdued">
                            <Translation id="moduleAccounts.accountDetail.stablecoinYield.apy" />
                        </Text>
                        <Text variant="body-sm" color={apyColor}>
                            {apyValue}
                        </Text>
                    </HStack>
                    <CardDivider />
                    <HStack justifyContent="space-between" alignItems="center">
                        <Text variant="body-sm" color="textSubdued">
                            <Translation id="moduleAccounts.accountDetail.stablecoinYield.supplied" />
                        </Text>
                        {account && token && (
                            <HStack alignItems="center" spacing="sp8">
                                <CryptoIconWithNetwork
                                    symbol={account.symbol}
                                    contractAddress={tokenContract}
                                    size="extraSmall"
                                />
                                <TokenAmountFormatter
                                    value={token.balance ?? '0'}
                                    tokenSymbol={token.symbol as TokenSymbol}
                                    color="textDefault"
                                    variant="body-sm"
                                />
                            </HStack>
                        )}
                    </HStack>
                </VStack>
            </Card>
        </Box>
    );
};
