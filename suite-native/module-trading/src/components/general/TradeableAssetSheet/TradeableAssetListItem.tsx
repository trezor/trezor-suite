import { useDispatch, useSelector } from 'react-redux';

import { invariant } from '@suite-common/suite-utils';
import { cryptoIdToSymbol } from '@suite-common/trading';

import { TradingRootState, tradingActions } from '../../../reducers';
import { selectIsTradingFavouriteAsset } from '../../../selectors/favouritesSelectors';
import { TradeableAsset } from '../../../types/general';
import { ASSET_ITEM_HEIGHT, AssetListItem } from '../AssetListItem';
import { FavouriteIcon } from './FavouriteIcon';

export type TradeableAssetListItemProps = {
    asset: TradeableAsset;
    onPress: () => void;
};

export { ASSET_ITEM_HEIGHT };

export const TradeableAssetListItem = ({ asset, onPress }: TradeableAssetListItemProps) => {
    const dispatch = useDispatch();

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
        <AssetListItem
            name={name}
            symbol={symbol}
            contractAddress={contractAddress}
            networkSymbol={networkSymbol}
            onPress={onPress}
            rightContent={<FavouriteIcon isFavourite={isFavourite} onPress={onFavouritePress} />}
        />
    );
};
