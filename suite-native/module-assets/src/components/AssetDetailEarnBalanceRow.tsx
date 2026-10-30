import { type RouteProp, useRoute } from '@react-navigation/native';

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
    backgroundColor:
        utils.colors[type === 'staking' ? 'elementFillBrandBold' : 'elementFillAccentVioletBold'],
}));

type AssetDetailEarnBalanceRowProps = {
    amount: string;
    type: BalanceType;
};

export const AssetDetailEarnBalanceRow = ({ amount, type }: AssetDetailEarnBalanceRowProps) => {
    const { networkSymbol } =
        useRoute<RouteProp<AssetsStackParamList, AssetsStackRoutes.AssetDetail>>().params;
    const { applyStyle } = useNativeStyles();

    return (
        <HStack alignItems="center" justifyContent="space-between" spacing="sp16">
            <HStack alignItems="center" spacing="sp12">
                <Box style={applyStyle(balanceIndicatorStyle, { type })} />
                <Text variant="body-sm" color="contentSecondary">
                    <Translation
                        id={
                            type === 'staking'
                                ? 'moduleAssets.assetDetailScreen.earnSection.staking'
                                : 'moduleAssets.assetDetailScreen.earnSection.available'
                        }
                    />
                </Text>
            </HStack>

            <HStack alignItems="center" justifyContent="flex-end" flexShrink={1}>
                <CryptoToFiatAmountFormatter
                    value={amount}
                    symbol={networkSymbol}
                    isBalance
                    variant="body-sm-strong"
                    numberOfLines={1}
                    adjustsFontSizeToFit
                />
            </HStack>
        </HStack>
    );
};
