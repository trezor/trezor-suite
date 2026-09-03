import { type ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { calculateRewards } from '@suite-common/wallet-core';
import { Box, HStack, Text, VStack } from '@suite-native/atoms';
import { selectSupportedLanguageLocale } from '@suite-native/intl';

import { formatEarnAmount } from '../../utils/earn/earnAmountUtils';

type EarnEstimatedRewardsProps = {
    amountValue: string;
    apy: number | null;
    label: ReactNode;
    symbol: string;
};

export const EarnEstimatedRewards = ({
    amountValue,
    apy,
    label,
    symbol,
}: EarnEstimatedRewardsProps) => {
    const locale = useSelector(selectSupportedLanguageLocale);

    const rewards = formatEarnAmount({ amount: calculateRewards(amountValue, apy), locale });

    return (
        <VStack spacing="sp4" paddingHorizontal="sp16">
            <Text variant="body-sm" color="contentPrimary" textAlign="center">
                {label}
            </Text>
            {/* A dust-sized estimate keeps its full precision, so the amount is the part that
            ellipsizes to keep the symbol on the same row. */}
            <HStack spacing="sp4" justifyContent="center" alignItems="center">
                <Box flexShrink={1}>
                    <Text
                        variant="headline-sm"
                        color="contentBrand"
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        {rewards}
                    </Text>
                </Box>
                <Text variant="headline-sm" color="contentBrand">
                    {symbol}
                </Text>
            </HStack>
        </VStack>
    );
};
