import { createSlice } from '@reduxjs/toolkit';

import { tradingInitialState } from '@suite-native/trading-consts';

export const TRADING_SELL = 'tradingSell';

const sellSlice = createSlice({
    name: TRADING_SELL,
    initialState: tradingInitialState.sell,
    reducers: {
        clearState: state => {
            state.tradingAccountKey = undefined;
            state.quotesRequest = undefined;
            state.quotes = [];
            state.selectedQuote = undefined;
            state.amountLimits = undefined;
            state.lastErrorMessage = undefined;
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
