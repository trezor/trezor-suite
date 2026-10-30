import { useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import {
    type HomeAssetTableState,
    selectWalletAssetKey,
    selectWalletAssetStakingRatio,
} from '@suite-common/assets';
import { Box, HStack } from '@suite-native/atoms';
import type { AssetsStackParamList, AssetsStackRoutes } from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { clamp } from '@trezor/utils';

type BalanceType = 'available' | 'staking';

const balanceBarSegmentStyle = prepareNativeStyle<{ type: BalanceType }>((utils, { type }) => ({
    height: utils.spacings.sp6,
    borderRadius: utils.borders.radii.r4,
    backgroundColor:
        utils.colors[type === 'staking' ? 'elementFillBrandBold' : 'elementFillAccentVioletBold'],
}));

export const AssetDetailEarnBalanceBar = () => {
    const { networkSymbol, tokenContract } =
        useRoute<RouteProp<AssetsStackParamList, AssetsStackRoutes.AssetDetail>>().params;
    const assetKey = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetKey(state, networkSymbol, tokenContract),
    );
    const stakingRatio = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetStakingRatio(state, assetKey),
    );
    const { applyStyle } = useNativeStyles();
    const clampedStakingRatio = clamp(stakingRatio ?? 0, 0, 1);
    const availableRatio = 1 - clampedStakingRatio;

    return (
        <HStack spacing="sp4">
            {availableRatio > 0 && (
                <Box
                    flex={availableRatio}
                    style={applyStyle(balanceBarSegmentStyle, { type: 'available' })}
                />
            )}
            {clampedStakingRatio > 0 && (
                <Box
                    flex={clampedStakingRatio}
                    style={applyStyle(balanceBarSegmentStyle, { type: 'staking' })}
                />
            )}
        </HStack>
    );
};
