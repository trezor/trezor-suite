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

import { ReceiveAccount } from './types';

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
        clearBuyState: state => {
            state.buy.selectedReceiveAccount = undefined;
            state.buy.quotesRequest = undefined;
            state.buy.quotes = [];
            state.buy.selectedQuote = undefined;
            state.buy.amountLimits = undefined;
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
    clearBuyState,
} = tradingSlice.actions;

export const createMemoizedSelector = createWeakMapSelector.withTypes<TradingRootState>();
