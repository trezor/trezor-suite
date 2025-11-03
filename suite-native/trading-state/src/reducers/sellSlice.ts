import { createSlice } from '@reduxjs/toolkit';

import { TradingSellState as CommonTradingSellState, initialState } from '@suite-common/trading';

export interface TradingSellState extends CommonTradingSellState {}

export const sellInitialState: TradingSellState = initialState.sell;

export const TRADING_SELL = 'tradingSell';

const sellSlice = createSlice({
    name: TRADING_SELL,
    initialState: initialState.sell,
    reducers: {
        clearState: state => {
            state.tradingAccountKey = undefined;
            state.quotesRequest = undefined;
            state.quotes = [];
            state.selectedQuote = undefined;
            state.amountLimits = undefined;
        },
        clearQuotesAndQuotesRequest: state => {
            state.quotesRequest = undefined;
            state.quotes = [];
        },
        sendAssetChanged: state => {
            state.amountLimits = undefined;
            state.quotesRequest = undefined;
        },
        fiatCurrencyChanged: state => {
            state.amountLimits = undefined;
            state.quotesRequest = undefined;
        },
    },
});

export const sellReducer = sellSlice.reducer;
export const sellActions = sellSlice.actions;
