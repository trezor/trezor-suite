import { PayloadAction } from '@reduxjs/toolkit';

import { createSliceWithExtraDeps, createWeakMapSelector } from '@suite-common/redux-utils';
import {
    TradingBuyState as CommonTradingBuyState,
    TradingState as CommonTradingState,
    InvityServerEnvironment,
    initialState as commonInitialState,
    prepareTradingReducer,
} from '@suite-common/trading';

import { ReceiveAccount, TradeableAsset } from './types';

export interface TradingBuyState extends CommonTradingBuyState {
    selectedReceiveAccount: ReceiveAccount | undefined;
}

export interface TradingState extends CommonTradingState {
    buy: TradingBuyState;
    favouriteAssets: Record<string, TradeableAsset>;
    tradingEnvironment: InvityServerEnvironment;
}

export type TradingRootState = {
    wallet: {
        tradingNew: TradingState;
    };
};

export const initialState: TradingState = {
    ...commonInitialState,
    buy: { ...commonInitialState.buy, selectedReceiveAccount: undefined },
    favouriteAssets: {},
    tradingEnvironment: 'production',
};

export const getTradeableAssetFavouriteKey = (asset: TradeableAsset) =>
    asset.contractAddress ? `${asset.symbol}_${asset.contractAddress}` : asset.symbol;

export const tradingSlice = createSliceWithExtraDeps({
    name: 'trading',
    initialState,
    reducers: {
        setBuySelectedReceiveAccount: (
            state,
            { payload }: PayloadAction<{ selectedReceiveAccount: ReceiveAccount | undefined }>,
        ) => {
            state.buy.selectedReceiveAccount = payload.selectedReceiveAccount;
        },
        addTradeableAssetToFavourites: (state, { payload }: PayloadAction<TradeableAsset>) => {
            state.favouriteAssets[getTradeableAssetFavouriteKey(payload)] = payload;
        },
        removeTradeableAssetFromFavourites: (state, { payload }: PayloadAction<TradeableAsset>) => {
            delete state.favouriteAssets[getTradeableAssetFavouriteKey(payload)];
        },
        setTradingEnvironment: (state, { payload }: PayloadAction<InvityServerEnvironment>) => {
            state.tradingEnvironment = payload;
        },
    },
    extraReducers: (builder, extra) => {
        const commonTradingFormReducer = prepareTradingReducer(extra);
        builder
            // In case that this reducer does not match the action, try to handle it by suite-common tradingReducer.
            .addDefaultCase((state, action) => {
                commonTradingFormReducer(state, action);
            });
    },
});

export const {
    setBuySelectedReceiveAccount,
    addTradeableAssetToFavourites,
    removeTradeableAssetFromFavourites,
    setTradingEnvironment,
} = tradingSlice.actions;

export const createMemoizedSelector = createWeakMapSelector.withTypes<TradingRootState>();

export const selectTradingBuy = (state: TradingRootState) => state.wallet.tradingNew.buy;

export const selectTradingFavouriteAssets = (state: TradingRootState) =>
    state.wallet.tradingNew.favouriteAssets;

export const selectTradingFavouriteAssetsArray = createMemoizedSelector(
    [selectTradingFavouriteAssets],
    assets => Object.values(assets),
);

export const selectIsTradingFavouriteAsset = createMemoizedSelector(
    [selectTradingFavouriteAssets, (_state, asset: TradeableAsset) => asset],
    (assets, asset) => !!assets[getTradeableAssetFavouriteKey(asset)],
);

export const selectBuySelectedReceiveAccount = (state: TradingRootState) =>
    selectTradingBuy(state).selectedReceiveAccount;

export const selectTradingEnvironment = (state: TradingRootState) =>
    state.wallet.tradingNew.tradingEnvironment;
