import { Pressable } from 'react-native';

import { useFormatters } from '@suite-common/formatters';
import { Box, HStack, PriceChangeBadge, RoundedIcon, Text, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { FavouriteIcon } from './FavouriteIcon';
import { TradeableAsset } from '../../../types';

export type AssetListItemProps = {
    asset: TradeableAsset;
    fiatRate: number;
    priceChange: number;
    onPress: () => void;
    onFavouritePress: () => void;
    isFavourite?: boolean;
    isFirst?: boolean;
    isLast?: boolean;
};

type AssetItemStyleProps = {
    isFirst: boolean;
    isLast: boolean;
};

export const ASSET_ITEM_HEIGHT = 68;

const itemStyle = prepareNativeStyle<AssetItemStyleProps>(
    ({ colors, spacings, borders }, { isFirst, isLast }) => ({
        backgroundColor: colors.backgroundSurfaceElevation1,
        paddingHorizontal: spacings.sp12,
        extend: [
            {
                condition: isFirst,
                style: {
                    borderTopLeftRadius: borders.radii.r20,
                    borderTopRightRadius: borders.radii.r20,
                },
            },
            {
                condition: isLast,
                style: {
                    borderBottomLeftRadius: borders.radii.r20,
                    borderBottomRightRadius: borders.radii.r20,
                },
            },
        ],
    }),
);

const vStackStyle = prepareNativeStyle(({ spacings }) => ({
    height: ASSET_ITEM_HEIGHT,
    justifyContent: 'center',
    flex: 1,
    gap: 0,
    paddingVertical: spacings.sp12,
}));

export const TradeableAssetListItem = ({
    asset: { symbol, contractAddress, name },
    fiatRate,
    priceChange,
    onPress,
    onFavouritePress,
    isFavourite = false,
    isFirst = false,
    isLast = false,
}: AssetListItemProps) => {
    const { applyStyle } = useNativeStyles();
    const { DisplaySymbolFormatter, FiatAmountFormatter, NetworkNameFormatter } = useFormatters();

    const assetName = name ?? <NetworkNameFormatter value={symbol} />;

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="radio"
            accessibilityLabel={name ?? symbol}
            style={applyStyle(itemStyle, { isFirst, isLast })}
        >
            <HStack alignItems="center" spacing="sp12">
                <Box justifyContent="center">
                    <RoundedIcon symbol={symbol} contractAddress={contractAddress} />
                </Box>
                <VStack style={applyStyle(vStackStyle)}>
                    <HStack alignItems="center" justifyContent="space-between">
                        <Text variant="body" color="textDefault">
                            {assetName}
                        </Text>
                        <Text variant="body" color="textDefault">
                            <FiatAmountFormatter value={fiatRate} />
                        </Text>
                    </HStack>
                    <HStack alignItems="center" justifyContent="space-between">
                        <Text variant="hint" color="textSubdued">
                            <DisplaySymbolFormatter value={symbol} areAmountUnitsEnabled={false} />
                        </Text>
                        <PriceChangeBadge valuePercentageChange={priceChange} />
                    </HStack>
                </VStack>
                <Box justifyContent="center">
                    <FavouriteIcon isFavourite={isFavourite} onPress={onFavouritePress} />
                </Box>
            </HStack>
        </Pressable>
    );
};
