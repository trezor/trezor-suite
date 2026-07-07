import { createSlice } from '@reduxjs/toolkit';

import { type TradingBuyState } from '@suite-common/trading';
import { tradingInitialState } from '@suite-native/trading-consts';

export const TRADING_BUY = 'tradingBuy';

const buySlice = createSlice({
    name: TRADING_BUY,
    initialState: tradingInitialState.buy,
    reducers: {
        clearState: (state: TradingBuyState) => {
            state.tradingAccountKey = undefined;
            state.receiveAccountKey = undefined;
            state.receiveAddress = undefined;
            state.quotesRequest = undefined;
            state.quotes = [];
            state.selectedQuote = undefined;
            state.amountLimits = undefined;
            state.lastErrorMessage = undefined;
        },
        clearQuotesAndQuotesRequest: (state: TradingBuyState) => {
            state.quotesRequest = undefined;
            state.quotes = [];
        },
        assetChanged: (state: TradingBuyState) => {
            state.tradingAccountKey = undefined;
            state.receiveAccountKey = undefined;
            state.receiveAddress = undefined;
            state.amountLimits = undefined;
            state.quotesRequest = undefined;
        },
        assetTokenChanged: (state: TradingBuyState) => {
            state.amountLimits = undefined;
            state.quotesRequest = undefined;
        },
        fiatCurrencyChanged: (state: TradingBuyState) => {
            state.amountLimits = undefined;
            state.quotesRequest = undefined;
        },
    },
});

export const buyReducer = buySlice.reducer;
export const buyActions = buySlice.actions;
