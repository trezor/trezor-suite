import { useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { type StakeRootState, selectApy } from '@suite-common/wallet-core';
import { Box, HStack, Text } from '@suite-native/atoms';
import { CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';
import type { AssetsStackParamList, AssetsStackRoutes } from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type BalanceType = 'available' | 'staking';

const balanceIndicatorStyle = prepareNativeStyle<{ type: BalanceType }>((utils, { type }) => ({
    width: utils.spacings.sp12,
    height: utils.spacings.sp12,
    borderRadius: utils.borders.radii.r4,
    backgroundColor: utils.colors[type === 'staking' ? 'contentBrand' : 'elementFillBrandSofter'],
}));

type AssetDetailEarnBalanceRowProps = {
    amount: string;
    type: BalanceType;
};

export const AssetDetailEarnBalanceRow = ({ amount, type }: AssetDetailEarnBalanceRowProps) => {
    const { networkSymbol } =
        useRoute<RouteProp<AssetsStackParamList, AssetsStackRoutes.AssetDetail>>().params;
    const { applyStyle } = useNativeStyles();
    const apy = useSelector((state: StakeRootState) =>
        type === 'staking' ? selectApy(state, { networkSymbol }) : null,
    );

    return (
        <HStack alignItems="center" justifyContent="space-between" spacing="sp16">
            <HStack alignItems="center" spacing="sp12">
                <Box style={applyStyle(balanceIndicatorStyle, { type })} />
                <Text variant="body-md" color="contentSecondary">
                    <Translation
                        id={
                            type === 'staking'
                                ? 'moduleAssets.assetDetailScreen.earnSection.staking'
                                : 'moduleAssets.assetDetailScreen.earnSection.available'
                        }
                    />
                </Text>
            </HStack>

            <HStack alignItems="center" justifyContent="flex-end" spacing="sp12" flexShrink={1}>
                {apy != null && apy > 0 && (
                    <Text variant="body-md" color="contentBrand" numberOfLines={1}>
                        <Translation id="earn.yieldRateBadge.apy" values={{ value: apy }} />
                    </Text>
                )}
                <CryptoToFiatAmountFormatter
                    value={amount}
                    symbol={networkSymbol}
                    isBalance
                    variant="body-md-strong"
                    numberOfLines={1}
                    adjustsFontSizeToFit
                />
            </HStack>
        </HStack>
    );
};
