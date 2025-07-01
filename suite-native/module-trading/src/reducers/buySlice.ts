import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { TradingBuyState as CommonTradingBuyState, initialState } from '@suite-common/trading';
import { Address } from '@trezor/blockchain-link-types';

export interface TradingBuyState extends CommonTradingBuyState {
    receiveAddress: Address | undefined;
}

export const buyInitialState: TradingBuyState = {
    ...initialState.buy,
    receiveAddress: undefined,
};

export const TRADING_BUY = 'tradingBuy';

const buySlice = createSlice({
    name: TRADING_BUY,
    initialState: buyInitialState,
    reducers: {
        setReceiveAddress: (state, { payload }: PayloadAction<Address | undefined>) => {
            state.receiveAddress = payload;
        },
        clearState: state => {
            state.tradingAccountKey = undefined;
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
        assetChanged: state => {
            state.tradingAccountKey = undefined;
            state.receiveAddress = undefined;
            state.amountLimits = undefined;
            state.quotesRequest = undefined;
        },
        fiatCurrencyChanged: state => {
            state.amountLimits = undefined;
            state.quotesRequest = undefined;
        },
    },
});

export const buyReducer = buySlice.reducer;
export const buyActions = buySlice.actions;
