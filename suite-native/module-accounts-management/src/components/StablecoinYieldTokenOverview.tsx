import { useSelector } from 'react-redux';

import { useAllYieldOpportunities } from '@suite-common/earn-api';
import { AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { AccountKey, TokenAddress, TokenSymbol } from '@suite-common/wallet-types';
import { Box, Card, CardDivider, HStack, InlineAlertBox, Text, VStack } from '@suite-native/atoms';
import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';
import { TokenAmountFormatter } from '@suite-native/formatters';
import { CryptoIconWithNetwork, Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

type StablecoinYieldTokenOverviewProps = {
    accountKey: AccountKey;
    tokenContract: TokenAddress;
};

export const StablecoinYieldTokenOverview = ({
    accountKey,
    tokenContract,
}: StablecoinYieldTokenOverviewProps) => {
    const isEnabled = useFeatureFlag(FeatureFlag.IsStablecoinYieldEnabled);
    const { yieldOpportunities } = useAllYieldOpportunities();
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    if (!isEnabled) return null;

    const normalizedContract = tokenContract.toLowerCase();
    const vault = yieldOpportunities.find(
        v => v.token.address?.toLowerCase() === normalizedContract,
    );

    if (!vault) return null;

    const token = account?.tokens?.find(t => t.contract?.toLowerCase() === normalizedContract);
    const vaultName = vault.outputToken?.name ?? '';
    const apy =
        vault.rewardRate.total != null ? `${(vault.rewardRate.total * 100).toFixed(2)}%` : null;

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
                        {apy !== null ? (
                            <Text variant="body-sm">{apy}</Text>
                        ) : (
                            <Text variant="body-sm" color="textSubdued">
                                <Translation id="earn.notAvailable" />
                            </Text>
                        )}
                    </HStack>
                    <CardDivider />
                    <HStack justifyContent="space-between" alignItems="center">
                        <Text variant="body-sm" color="textSubdued">
                            <Translation id="moduleAccounts.accountDetail.stablecoinYield.supplied" />
                        </Text>
                        {token && (
                            <HStack alignItems="center" spacing="sp8">
                                <CryptoIconWithNetwork
                                    symbol={account!.symbol}
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
