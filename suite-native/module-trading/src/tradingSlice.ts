import { PayloadAction } from '@reduxjs/toolkit';

import { createSliceWithExtraDeps, createWeakMapSelector } from '@suite-common/redux-utils';
import {
    TradingBuyState as CommonTradingBuyState,
    TradingState as CommonTradingState,
    initialState as commonInitialState,
    prepareTradingReducer,
} from '@suite-common/trading';

import { ReceiveAccount } from './types';

export interface TradingBuyState extends CommonTradingBuyState {
    selectedReceiveAccount: ReceiveAccount | undefined;
}

export interface TradingState extends CommonTradingState {
    buy: TradingBuyState;
}

export type TradingRootState = {
    wallet: {
        trading: TradingState;
    };
};

export const initialState: TradingState = {
    ...commonInitialState,
    buy: { ...commonInitialState.buy, selectedReceiveAccount: undefined },
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

export const { setBuySelectedReceiveAccount } = tradingSlice.actions;

export const createMemoizedSelector = createWeakMapSelector.withTypes<TradingRootState>();

export const selectTradingBuy = (state: TradingRootState) => state.wallet.trading.buy;

export const selectBuySelectedReceiveAccount = (state: TradingRootState) =>
    selectTradingBuy(state).selectedReceiveAccount;
