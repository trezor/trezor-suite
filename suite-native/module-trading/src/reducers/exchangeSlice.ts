import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import {
    TradingExchangeState as CommonTradingExchangeState,
    initialState,
} from '@suite-common/trading';
import { Address } from '@trezor/blockchain-link-types';

export interface TradingExchangeState extends CommonTradingExchangeState {
    receiveAddress: Address | undefined;
}

export const exchangeInitialState: TradingExchangeState = {
    ...initialState.exchange,
    receiveAddress: undefined,
};

export const TRADING_EXCHANGE = 'tradingExchange';

const exchangeSlice = createSlice({
    name: TRADING_EXCHANGE,
    initialState: exchangeInitialState,
    reducers: {
        setReceiveAddress: (state, { payload }: PayloadAction<Address | undefined>) => {
            state.receiveAddress = payload;
        },
        clearState: state => {
            state.tradingAccountKey = undefined;
            state.receiveAccountKey = undefined;
            state.receiveAddress = undefined;
            state.quotesRequest = undefined;
            state.quotes = [];
            state.selectedQuote = undefined;
            state.amountLimits = undefined;
        },
        clearQuotesAndQuotesRequest: state => {
            state.quotesRequest = undefined;
            state.quotes = [];
        },
    },
});

export const exchangeReducer = exchangeSlice.reducer;
export const exchangeActions = exchangeSlice.actions;
