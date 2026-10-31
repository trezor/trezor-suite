import { useSelector } from 'react-redux';

import { type HomeAssetTableState, selectWalletAssetStakingRatio } from '@suite-common/assets';
import { type WalletAssetKey } from '@suite-common/wallet-core';
import { Box, HStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { clamp } from '@trezor/utils';

import { type EarnBalanceType, earnBalanceColors } from './earnBalance';

const balanceBarSegmentStyle = prepareNativeStyle<{ type: EarnBalanceType }>((utils, { type }) => ({
    height: utils.spacings.sp6,
    borderRadius: utils.borders.radii.r4,
    backgroundColor: utils.colors[earnBalanceColors[type]],
}));

type AssetDetailEarnBalanceBarProps = {
    assetKey: WalletAssetKey | undefined;
};

export const AssetDetailEarnBalanceBar = ({ assetKey }: AssetDetailEarnBalanceBarProps) => {
    const stakingRatio = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetStakingRatio(state, assetKey),
    );
    const { applyStyle } = useNativeStyles();
    // Guards the flex weights below: the ratio is a raw division, so corrupt amounts could push it
    // out of range and make a segment collapse or take negative space.
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
