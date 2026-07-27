import { createSlice } from '@reduxjs/toolkit';

import { type TradingExchangeState } from '@suite-common/trading';
import { tradingInitialState } from '@suite-native/trading-consts';

export const TRADING_EXCHANGE = 'tradingExchange';

const exchangeSlice = createSlice({
    name: TRADING_EXCHANGE,
    initialState: tradingInitialState.exchange,
    reducers: {
        clearState: (state: TradingExchangeState) => {
            state.tradingAccountKey = undefined;
            state.receiveAccountKey = undefined;
            state.receiveAddress = undefined;
            state.quotesRequest = undefined;
            state.quotes = [];
            state.selectedQuote = undefined;
            state.amountLimits = undefined;
            state.lastErrorMessage = undefined;
        },
        clearQuotesAndQuotesRequest: (state: TradingExchangeState) => {
            state.quotesRequest = undefined;
            state.quotes = [];
        },
        sendAssetChanged: (state: TradingExchangeState) => {
            state.amountLimits = undefined;
            state.quotesRequest = undefined;
        },
        receiveAssetChanged: (state: TradingExchangeState) => {
            state.amountLimits = undefined;
            state.quotesRequest = undefined;
            state.receiveAccountKey = undefined;
            state.receiveAddress = undefined;
        },
        receiveTokenChanged: (state: TradingExchangeState) => {
            state.amountLimits = undefined;
            state.quotesRequest = undefined;
        },
    },
});

export const exchangeReducer = exchangeSlice.reducer;
export const exchangeActions = exchangeSlice.actions;
