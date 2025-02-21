import { Pressable } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { useFormatters } from '@suite-common/formatters';
import { Box, HStack, PriceChangeBadge, RoundedIcon, Text, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { FavouriteIcon } from './FavouriteIcon';
import {
    TradingRootState,
    addTradeableAssetToFavourites,
    removeTradeableAssetFromFavourites,
    selectIsTradingFavouriteAsset,
} from '../../../tradingSlice';
import { TradeableAsset } from '../../../types';

export type TradeableAssetListItemProps = {
    asset: TradeableAsset;
    fiatRate: number;
    priceChange: number;
    onPress: () => void;
};

export const ASSET_ITEM_HEIGHT = 68;

const vStackStyle = prepareNativeStyle(({ spacings }) => ({
    height: ASSET_ITEM_HEIGHT,
    justifyContent: 'center',
    flex: 1,
    gap: 0,
    paddingVertical: spacings.sp12,
}));

export const TradeableAssetListItem = ({
    asset,
    fiatRate,
    priceChange,
    onPress,
}: TradeableAssetListItemProps) => {
    const { applyStyle } = useNativeStyles();
    const { DisplaySymbolFormatter, FiatAmountFormatter, NetworkNameFormatter } = useFormatters();
    const dispatch = useDispatch();

    const isFavourite = useSelector((state: TradingRootState) =>
        selectIsTradingFavouriteAsset(state, asset),
    );

    const onFavouritePress = () => {
        if (isFavourite) {
            dispatch(removeTradeableAssetFromFavourites(asset));
        } else {
            dispatch(addTradeableAssetToFavourites(asset));
        }
    };

    const { symbol, contractAddress, name } = asset;
    const assetName = name ?? <NetworkNameFormatter value={symbol} />;

    return (
        <Pressable
            onPress={onPress}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={name ?? symbol}
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
