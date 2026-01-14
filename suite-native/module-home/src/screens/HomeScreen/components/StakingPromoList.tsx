import { NetworkSymbol } from '@suite-common/wallet-config';
import { Box, Text, VStack, cardVariantToColorsMap } from '@suite-native/atoms';
import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';
import { Translation } from '@suite-native/intl';

import { StakingPromoListItem } from './StakingPromoListItem';

const STAKING_PROMO_NETWORK_SYMBOLS: NetworkSymbol[] = ['sol'];

export const StakingPromoList = () => {
    const isStakingEnabled = useFeatureFlag(FeatureFlag.IsStakingEnabled);

    if (!isStakingEnabled) return null;

    return (
        <Box>
            <VStack spacing="sp2" paddingVertical="sp16">
                <Text variant="titleSmall">
                    <Translation id="moduleHome.stakingPromo.title" />
                </Text>

                <Text variant="hint" color={cardVariantToColorsMap.normal.subtitleColor}>
                    <Translation id="moduleHome.stakingPromo.subtitle" />
                </Text>
            </VStack>
            {STAKING_PROMO_NETWORK_SYMBOLS.map(networkSymbol => (
                <StakingPromoListItem networkSymbol={networkSymbol} key={networkSymbol} />
            ))}
        </Box>
    );
};
