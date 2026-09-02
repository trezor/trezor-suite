import { useCallback } from 'react';

import { useNavigation } from '@react-navigation/native';

import { useServices } from '@suite-common/dependency-injection';
import { BASE_CRYPTO_MAX_DISPLAYED_DECIMALS, useFormatters } from '@suite-common/formatters';
import { selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { isPositiveBalance } from '@suite-common/wallet-utils';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import { BannerInline, Box, Button, HStack, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import {
    type NativeStakingRootState,
    selectClaimableAmountByAccountKey,
    useSelector,
} from '@suite-native/staking';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { useMessageSystemStaking } from '../../hooks/staking/useMessageSystemStaking';
import { useEarnPortfolioTrackerGuard } from '../earn/EarnPortfolioTrackerGuard';

type NavigationProp = StackNavigationProps<RootStackParamList, RootStackRoutes.StakingManagement>;

type StakingManagementReadyToClaimCardProps = {
    accountKey: AccountKey;
};

const containerStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.elementFillBrandSoft,
    borderRadius: utils.borders.radii.r12,
    padding: utils.spacings.sp16,
}));

export const StakingManagementReadyToClaimCard = ({
    accountKey,
}: StakingManagementReadyToClaimCardProps) => {
    const { applyStyle } = useNativeStyles();
    const { isPortfolioTrackerDevice, openPortfolioTrackerSheet } = useEarnPortfolioTrackerGuard();
    const navigation = useNavigation<NavigationProp>();
    const { CryptoAmountFormatter: amountFormatter } = useFormatters();
    const { analytics } = useServices(selectNativeAnalyticsDep);

    const symbol = useSelector((state: NativeStakingRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );
    const claimableAmount =
        useSelector((state: NativeStakingRootState) =>
            selectClaimableAmountByAccountKey(state, accountKey),
        ) ?? '0';

    const { isClaimingDisabled, claimingMessageContent } = useMessageSystemStaking(symbol);

    const handleClaimPress = useCallback(() => {
        if (!symbol) {
            return;
        }

        if (isPortfolioTrackerDevice) {
            openPortfolioTrackerSheet();

            return;
        }

        analytics.report({
            type: events.stakingClaimEvent.name,
            payload: {
                action: 'continue',
                step: 'staking-dashboard',
                networkSymbol: symbol,
            },
        });
        navigation.navigate(RootStackRoutes.StakingClaimReview, { accountKey, symbol });
    }, [
        accountKey,
        analytics,
        navigation,
        symbol,
        isPortfolioTrackerDevice,
        openPortfolioTrackerSheet,
    ]);

    if (!symbol || !isPositiveBalance(claimableAmount)) {
        return null;
    }

    const formattedAmount = amountFormatter.format(claimableAmount, {
        isBalance: true,
        maxDisplayedDecimals: BASE_CRYPTO_MAX_DISPLAYED_DECIMALS,
        symbol,
        isEllipsisAppended: false,
    });

    return (
        <Box style={applyStyle(containerStyle)}>
            <HStack spacing="sp12">
                <Icon name="checkCircle" size="large" color="contentPrimary" />
                <VStack flex={1} spacing="sp12">
                    <Text variant="body-md">
                        <Translation
                            id="earn.stakingManagementScreen.claim.readyToClaim"
                            values={{
                                amount: formattedAmount,
                            }}
                        />
                    </Text>
                    {isClaimingDisabled && claimingMessageContent && (
                        <BannerInline intent="warning" title={claimingMessageContent} />
                    )}
                    <Button
                        size="medium"
                        isFullWidth
                        onPress={handleClaimPress}
                        isDisabled={isClaimingDisabled}
                    >
                        <Text variant="body-sm-strong" color="contentButtonBrandPrimary">
                            <Translation id="earn.stakingManagementScreen.claim.claimButton" />
                        </Text>
                    </Button>
                </VStack>
            </HStack>
        </Box>
    );
};
