import { createSlice } from '@reduxjs/toolkit';

import { tradingInitialState } from '@suite-native/trading-consts';

export const TRADING_EXCHANGE = 'tradingExchange';

const exchangeSlice = createSlice({
    name: TRADING_EXCHANGE,
    initialState: tradingInitialState.exchange,
    reducers: {
        clearState: state => {
            state.tradingAccountKey = undefined;
            state.receiveAccountKey = undefined;
            state.receiveAddress = undefined;
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
        receiveAssetChanged: state => {
            state.amountLimits = undefined;
            state.quotesRequest = undefined;
            state.receiveAccountKey = undefined;
            state.receiveAddress = undefined;
        },
        receiveTokenChanged: state => {
            state.amountLimits = undefined;
            state.quotesRequest = undefined;
        },
    },
});

export const exchangeReducer = exchangeSlice.reducer;
export const exchangeActions = exchangeSlice.actions;
