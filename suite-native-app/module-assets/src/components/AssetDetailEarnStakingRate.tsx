import { type RouteProp, useRoute } from '@react-navigation/native';

import { useNetworkStakingRate } from '@suite-common/earn-staking';
import { useFormatters } from '@suite-common/formatters';
import { isApyAvailable } from '@suite-common/wallet-utils';
import { Text } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import type { AssetsStackParamList, AssetsStackRoutes } from '@suite-native/navigation';

export const AssetDetailEarnStakingRate = () => {
    const { networkSymbol } =
        useRoute<RouteProp<AssetsStackParamList, AssetsStackRoutes.AssetDetail>>().params;
    const { rate, rateKind, isPending } = useNetworkStakingRate({ networkSymbol });
    const { PercentageFormatter } = useFormatters();
    const { translate } = useTranslate();

    // A product without a rate, a testnet, says so once its info is cached.
    if (isPending || rateKind === null) {
        return null;
    }

    const isApr = rateKind === 'apr';

    return (
        <Text variant="body-sm" color="contentBrand">
            {rate !== null && isApyAvailable(rate) ? (
                <Translation
                    id={isApr ? 'earn.aprPercentage' : 'earn.apyPercentage'}
                    values={{ apy: PercentageFormatter.format(rate) }}
                />
            ) : (
                <Translation
                    id={isApr ? 'earn.yieldRateBadge.apr' : 'earn.yieldRateBadge.apy'}
                    values={{ value: translate('earn.notAvailableShort') }}
                />
            )}
        </Text>
    );
};
