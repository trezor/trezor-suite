import { useCallback } from 'react';

import { getYieldVaultContractAddress } from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress, toTokenAddress } from '@suite-common/wallet-types';
import { Box, Button, Card, CardDivider, HStack, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { useResolvedYieldFlowData, useYieldDetailNavigation } from '@suite-native/module-earn';

type YieldVaultBannerProps = {
    accountKey: AccountKey;
    tokenContract: TokenAddress;
};

export const YieldVaultBanner = ({ accountKey, tokenContract }: YieldVaultBannerProps) => {
    const { account, resolutionStatus, vault } = useResolvedYieldFlowData({
        accountKey,
        tokenContract,
        displayError: false,
    });

    const { navigateToYieldDetail } = useYieldDetailNavigation();

    const onGoToVaultPress = useCallback(() => {
        if (!account || !vault) {
            return;
        }

        const vaultTokenContract = getYieldVaultContractAddress(vault);

        if (!vaultTokenContract) {
            return;
        }

        navigateToYieldDetail({
            accountKey: account.key,
            tokenContract: toTokenAddress(vaultTokenContract),
        });
    }, [account, vault, navigateToYieldDetail]);

    if (resolutionStatus !== 'resolved' || !vault?.outputToken?.name) return null;

    return (
        <Box marginHorizontal="sp16">
            <Card>
                <VStack spacing="sp16">
                    <HStack spacing="sp10">
                        <Icon name="info" size="mediumLarge" />
                        <Box flex={1}>
                            <Text variant="body-sm-strong">
                                <Translation id="moduleAccounts.accountDetail.stablecoinYield.defiYieldInfoText" />
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

                    <Button
                        intent="brand"
                        priority="secondary"
                        size="medium"
                        onPress={onGoToVaultPress}
                    >
                        <Translation id="earn.goToVault" />
                    </Button>
                </VStack>
            </Card>
        </Box>
    );
};
