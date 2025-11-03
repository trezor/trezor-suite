import { TradeableAsset } from '@suite-native/trading-types';

import { TradingRootState, createMemoizedSelector } from '../reducers';

export const selectTradingFavouriteAssets = (state: TradingRootState) =>
    state.wallet.trading.favouriteAssets;

export const selectTradingFavouriteAssetsArray = createMemoizedSelector(
    [selectTradingFavouriteAssets],
    assets => Object.keys(assets),
);

export const selectIsTradingFavouriteAsset = createMemoizedSelector(
    [selectTradingFavouriteAssets, (_state, asset: TradeableAsset) => asset],
    (assets, asset) => !!assets[asset.cryptoId],
);
