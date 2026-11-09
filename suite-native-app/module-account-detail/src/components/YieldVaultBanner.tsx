import { useCallback } from 'react';

import { type TokenAddress, toTokenAddress } from '@suite-common/tokens';
import { getYieldVaultContractAddress } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { Button, Card, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    useYieldDetailNavigation,
    useYieldEntryNavigationAnalytics,
    useYieldFlowData,
} from '@suite-native/module-earn';

type YieldVaultBannerProps = {
    accountKey: AccountKey;
    tokenContract: TokenAddress;
};

export const YieldVaultBanner = ({ accountKey, tokenContract }: YieldVaultBannerProps) => {
    const yieldFlowData = useYieldFlowData({
        accountKey,
        tokenContract,
        displayError: false,
    });

    const { account, resolutionStatus, vault } = yieldFlowData;

    const { navigateToYieldDetail } = useYieldDetailNavigation();
    const reportYieldEntryNavigation = useYieldEntryNavigationAnalytics();

    const handleManagePositionPress = useCallback(() => {
        if (!account || !vault) {
            return;
        }

        const vaultTokenContract = getYieldVaultContractAddress(vault);

        if (!vaultTokenContract) {
            return;
        }

        reportYieldEntryNavigation({
            destination: 'vault-detail',
            from: 'account-banner',
            item: { networkSymbol: account.symbol, yieldId: vault.id },
        });
        navigateToYieldDetail({
            accountKey: account.key,
            tokenContract: toTokenAddress(vaultTokenContract),
        });
    }, [account, vault, navigateToYieldDetail, reportYieldEntryNavigation]);

    if (resolutionStatus !== 'resolved') return null;

    return (
        <VStack marginHorizontal="sp16" spacing="sp16">
            <Text variant="headline-sm">
                <Translation id="earn.defiYield" />
            </Text>

            <Card noShadow>
                <Text variant="body-md">
                    <Translation id="moduleAccounts.accountDetail.stablecoinYield.defiYieldInfoText" />
                </Text>
            </Card>

            <Button
                intent="brand"
                priority="secondary"
                size="medium"
                onPress={handleManagePositionPress}
            >
                <Translation id="moduleAccounts.accountDetail.stablecoinYield.managePosition" />
            </Button>
        </VStack>
    );
};
