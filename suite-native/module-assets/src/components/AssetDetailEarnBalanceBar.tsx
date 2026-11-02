import { useSelector } from 'react-redux';

import { type HomeAssetTableState, selectWalletAssetStakingRatio } from '@suite-common/assets';
import { type WalletAssetKey } from '@suite-common/wallet-core';
import { Box, HStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

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
    const availableRatio = 1 - (stakingRatio ?? 0);

    return (
        <HStack spacing="sp4">
            {availableRatio > 0 && (
                <Box
                    flex={availableRatio}
                    style={applyStyle(balanceBarSegmentStyle, { type: 'available' })}
                />
            )}
            {stakingRatio !== undefined && (
                <Box
                    flex={stakingRatio}
                    style={applyStyle(balanceBarSegmentStyle, { type: 'staking' })}
                />
            )}
        </HStack>
    );
};
