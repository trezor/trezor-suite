import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { selectIsPortfolioTrackerDevice } from '@suite-common/device';
import { type BaseCurrencyAmount } from '@suite-common/wallet-types';
import { Button, HStack, Text, VStack } from '@suite-native/atoms';
import { BaseCurrencyAmountFormatter } from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';

import { type StablecoinYieldClaimSummary } from '../types';

type StablecoinYieldClaimRewardsCardSectionProps = {
    claimRewards: StablecoinYieldClaimSummary[];
    totalFiatClaimableAmount: BaseCurrencyAmount | null;
    isLoading: boolean;
    onPress: () => void;
};

export const StablecoinYieldClaimRewardsCardSection = ({
    claimRewards,
    totalFiatClaimableAmount,
    isLoading,
    onPress,
}: StablecoinYieldClaimRewardsCardSectionProps) => {
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);
    const isDisabled = claimRewards.length === 0 || isLoading;

    const handlePress = useCallback(() => {
        if (isDisabled) {
            return;
        }

        onPress();
    }, [isDisabled, onPress]);

    if (isPortfolioTrackerDevice || (claimRewards.length === 0 && !isLoading)) {
        return null;
    }

    return (
        <HStack spacing="sp24" alignItems="center">
            <VStack spacing={2} flex={1}>
                <Text variant="body-md" color="contentSecondary">
                    <Translation id="earn.earnScreen.depositsCard.availableRewards" />
                </Text>
                <BaseCurrencyAmountFormatter
                    value={totalFiatClaimableAmount}
                    variant="headline-md"
                    isDiscreetText={false}
                    isLoading={isLoading}
                />
            </VStack>
            <Button
                size="medium"
                intent="neutral"
                priority="secondary"
                isDisabled={isDisabled}
                isLoading={isLoading}
                onPress={handlePress}
            >
                <Translation id="earn.earnScreen.depositsCard.claimRewardsButton" />
            </Button>
        </HStack>
    );
};
