import { type PayloadAction } from '@reduxjs/toolkit';

import { createSliceWithExtraDeps } from '@suite-common/redux-utils';

import {
    TRADING_BUY_PREFIX,
    TRADING_EXCHANGE_PREFIX,
    TRADING_EXTENDED_PREFIX,
    TRADING_PREFIX,
    TRADING_SELL_PREFIX,
    TRADING_SETTINGS_PREFIX,
} from '../constants';
import { buyThunks } from '../thunks/buy';
import { exchangeThunks } from '../thunks/exchange';
import { sellThunks } from '../thunks/sell';
import { type TradingTransaction } from '../types';
import { tradingBuyReducer } from './buyReducer';
import { tradingExchangeReducer } from './exchangeReducer';
import { tradingSellReducer } from './sellReducer';
import { tradingSettingsReducer } from './settingsReducer';
import { initialState, tradingCommonReducer } from './tradingCommonReducer';

type StorageActionPayload = {
    tradingTrades?: TradingTransaction[];
};

const tradingSlice = createSliceWithExtraDeps({
    name: TRADING_EXTENDED_PREFIX,
    initialState,
    reducers: {},
    extraReducers: (builder, extra) => {
        builder
            .addCase(
                extra.actionTypes.storageLoad,
                (state, action: PayloadAction<StorageActionPayload>) => ({
                    ...state,
                    trades: action.payload.tradingTrades ?? state.trades,
                }),
            )
            .addCase(buyThunks.handleRequestThunk.pending, state => {
                state.buy.isLoading = true;
            })
            .addCase(buyThunks.handleRequestThunk.fulfilled, state => {
                state.buy.isLoading = false;
            })
            .addCase(buyThunks.handleRequestThunk.rejected, state => {
                state.buy.amountLimits = undefined;
                state.buy.quotes = [];
                state.buy.quotesRequest = undefined;
                state.info.paymentMethods = [];
            })
            .addCase(exchangeThunks.handleRequestThunk.pending, state => {
                state.exchange.isLoading = true;
            })
            .addCase(exchangeThunks.handleRequestThunk.fulfilled, state => {
                state.exchange.isLoading = false;
            })
            .addCase(sellThunks.handleRequestThunk.pending, state => {
                state.sell.isLoading = true;
                state.info.paymentMethods = [];
            })
            .addCase(sellThunks.handleRequestThunk.fulfilled, state => {
                state.sell.isLoading = false;
            })
            .addCase(sellThunks.handleRequestThunk.rejected, state => {
                state.sell.amountLimits = undefined;
                state.sell.quotes = [];
                state.sell.quotesRequest = undefined;
                state.sell.isLoading = false;
                state.info.paymentMethods = [];
            })
            .addCase(sellThunks.handleTradeThunk.pending, state => {
                state.exchange.isLoading = true;
            })
            .addCase(sellThunks.handleTradeThunk.fulfilled, state => {
                state.exchange.isLoading = false;
            })
            .addCase(exchangeThunks.confirmTradeThunk.pending, state => {
                state.exchange.isLoading = true;
            })
            .addCase(exchangeThunks.confirmTradeThunk.fulfilled, state => {
                state.exchange.isLoading = false;
            })
            .addMatcher(
                action => action.type.startsWith(TRADING_SETTINGS_PREFIX),
                (state, action) => {
                    tradingSettingsReducer(state.settings, action);
                },
            )
            .addMatcher(
                action => action.type.startsWith(TRADING_BUY_PREFIX),
                (state, action) => {
                    tradingBuyReducer(state.buy, action);
                },
            )
            .addMatcher(
                action => action.type.startsWith(TRADING_EXCHANGE_PREFIX),
                (state, action) => {
                    tradingExchangeReducer(state.exchange, action);
                },
            )
            .addMatcher(
                action => action.type.startsWith(TRADING_SELL_PREFIX),
                (state, action) => {
                    tradingSellReducer(state.sell, action);
                },
            )
            .addMatcher(action => action.type.startsWith(TRADING_PREFIX), tradingCommonReducer);
    },
});

export const prepareTradingReducer = tradingSlice.prepareReducer;
