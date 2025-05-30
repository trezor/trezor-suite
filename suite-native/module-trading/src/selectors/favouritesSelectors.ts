import { TradingRootState, createMemoizedSelector } from '../tradingSlice';
import { TradeableAsset } from '../types/general';

export const selectTradingFavouriteAssets = (state: TradingRootState) =>
    state.wallet.tradingNew.favouriteAssets;

export const selectTradingFavouriteAssetsArray = createMemoizedSelector(
    [selectTradingFavouriteAssets],
    assets => Object.keys(assets),
);

export const selectIsTradingFavouriteAsset = createMemoizedSelector(
    [selectTradingFavouriteAssets, (_state, asset: TradeableAsset) => asset],
    (assets, asset) => !!assets[asset.cryptoId],
);
