import type { CryptoId } from 'invity-api';

import { createWeakMapSelector } from '@suite-common/redux-utils';

import type { TradingRootState } from '../reducers/tradingCommonReducer';

const createMemoizedSelector = createWeakMapSelector.withTypes<TradingRootState>();

export const selectTradingFavouriteAssets = (state: TradingRootState) =>
    state.wallet.trading.favouriteAssets;

export const selectTradingFavouriteAssetsArray = createMemoizedSelector(
    [selectTradingFavouriteAssets],
    assets => Object.keys(assets),
);

export const selectIsTradingFavouriteAssetByCryptoId: (
    state: TradingRootState,
    cryptoId: CryptoId,
) => boolean = createMemoizedSelector(
    [selectTradingFavouriteAssets, (_state: TradingRootState, cryptoId: CryptoId) => cryptoId],
    (assets, cryptoId) => !!assets[cryptoId],
);
