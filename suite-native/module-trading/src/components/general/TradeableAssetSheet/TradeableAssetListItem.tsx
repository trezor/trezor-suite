import { Pressable } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { invariant } from '@suite-common/suite-utils';
import { cryptoIdToSymbol } from '@suite-common/trading';
import { Box, HStack, Text, VStack } from '@suite-native/atoms';
import { CryptoIconWithNetwork } from '@suite-native/icons';
import { useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { selectIsTradingFavouriteAsset } from '../../../selectors/favouritesSelectors';
import { TradeableAsset } from '../../../types/general';
import { NetworkBadge } from '../NetworkBadge';
import { NetworkSymbolExtendedFormatter } from '../NetworkSymbolExtendedFormatter';
import { FavouriteIcon } from './FavouriteIcon';
import { TradingRootState, tradingActions } from '../../../tradingSlice';

export type TradeableAssetListItemProps = {
    asset: TradeableAsset;
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

export const TradeableAssetListItem = ({ asset, onPress }: TradeableAssetListItemProps) => {
    const { applyStyle } = useNativeStyles();
    const dispatch = useDispatch();
    const { translate } = useTranslate();

    const isFavourite = useSelector((state: TradingRootState) =>
        selectIsTradingFavouriteAsset(state, asset),
    );
    const { symbol, name, contractAddress, cryptoId } = asset;

    const networkSymbol = cryptoIdToSymbol(cryptoId);
    invariant(networkSymbol, `Network symbol not found for cryptoId: ${cryptoId}`);

    const onFavouritePress = () => {
        if (isFavourite) {
            dispatch(tradingActions.removeTradeableAssetFromFavourites(asset.cryptoId));
        } else {
            dispatch(tradingActions.addTradeableAssetToFavourites(asset.cryptoId));
        }
    };

    return (
        <Pressable
            onPress={onPress}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={name}
        >
            <HStack alignItems="center" spacing="sp12">
                <Box justifyContent="center">
                    <CryptoIconWithNetwork
                        symbol={networkSymbol}
                        contractAddress={contractAddress}
                    />
                </Box>
                <VStack style={applyStyle(vStackStyle)}>
                    <HStack alignItems="center" justifyContent="space-between">
                        <Text
                            variant="body"
                            color="textDefault"
                            accessibilityLabel={translate('moduleTrading.coinName')}
                        >
                            {name}
                        </Text>
                    </HStack>
                    <HStack alignItems="center" justifyContent="flex-start">
                        <NetworkSymbolExtendedFormatter
                            symbol={symbol}
                            accessibilityLabel={translate('moduleTrading.coinSymbol')}
                        />
                        <NetworkBadge cryptoId={cryptoId} />
                    </HStack>
                </VStack>
                <Box justifyContent="center">
                    <FavouriteIcon isFavourite={isFavourite} onPress={onFavouritePress} />
                </Box>
            </HStack>
        </Pressable>
    );
};
