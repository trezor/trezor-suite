import { PayloadAction } from '@reduxjs/toolkit';
import { CryptoId } from 'invity-api';

import { createSliceWithExtraDeps, createWeakMapSelector } from '@suite-common/redux-utils';
import {
    TradingBuyState as CommonTradingBuyState,
    TradingState as CommonTradingState,
    InvityServerEnvironment,
    initialState as commonInitialState,
    prepareTradingReducer,
} from '@suite-common/trading';

import { ReceiveAccount, TradeableAsset } from './types';
import { coinInfoToTradeableAsset } from './utils';

export interface TradingBuyState extends CommonTradingBuyState {
    selectedReceiveAccount: ReceiveAccount | undefined;
}

export interface TradingState extends CommonTradingState {
    buy: TradingBuyState;
    favouriteAssets: Record<CryptoId, true>;
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
        addTradeableAssetToFavourites: (state, { payload }: PayloadAction<CryptoId>) => {
            state.favouriteAssets[payload] = true;
        },
        removeTradeableAssetFromFavourites: (state, { payload }: PayloadAction<CryptoId>) => {
            delete state.favouriteAssets[payload];
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
    assets => Object.keys(assets),
);

export const selectIsTradingFavouriteAsset = createMemoizedSelector(
    [selectTradingFavouriteAssets, (_state, asset: TradeableAsset) => asset],
    (assets, asset) => !!assets[asset.cryptoId],
);

export const selectBuySelectedReceiveAccount = (state: TradingRootState) =>
    selectTradingBuy(state).selectedReceiveAccount;

export const selectTradingEnvironment = (state: TradingRootState) =>
    state.wallet.tradingNew.tradingEnvironment;

export const selectTradingBuyCoins = createMemoizedSelector(
    [state => state.wallet.tradingNew.info.coins],
    coins => {
        if (!coins) {
            return [];
        }

        return Object.entries(coins)
            .filter(([_, { services }]) => services.buy)
            .map(([cryptoId, coinInfo]) =>
                coinInfoToTradeableAsset(cryptoId as CryptoId, coinInfo),
            );
    },
);
