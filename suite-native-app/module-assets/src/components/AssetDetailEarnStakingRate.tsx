import { type RouteProp, useRoute } from '@react-navigation/native';

import { useFormatters } from '@suite-common/formatters';
import { isApyAvailable } from '@suite-common/wallet-utils';
import { Text } from '@suite-native/atoms';
import { getStakingRateLabelType, useStakingRate } from '@suite-native/earn';
import { Translation } from '@suite-native/intl';
import type { AssetsStackParamList, AssetsStackRoutes } from '@suite-native/navigation';

export const AssetDetailEarnStakingRate = () => {
    const { networkSymbol } =
        useRoute<RouteProp<AssetsStackParamList, AssetsStackRoutes.AssetDetail>>().params;
    const { rate } = useStakingRate({ symbol: networkSymbol });
    const { PercentageFormatter } = useFormatters();

    if (rate == null || !isApyAvailable(rate)) {
        return null;
    }

    return (
        <Text variant="body-sm" color="contentBrand">
            <Translation
                id={
                    getStakingRateLabelType(networkSymbol) === 'apr'
                        ? 'earn.aprPercentage'
                        : 'earn.apyPercentage'
                }
                values={{ apy: PercentageFormatter.format(rate) }}
            />
        </Text>
    );
};
