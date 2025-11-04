import { PayloadAction, isAnyOf } from '@reduxjs/toolkit';
import type { CryptoId } from 'invity-api';

import { createSliceWithExtraDeps } from '@suite-common/redux-utils';
import { InvityServerEnvironment, TradingType, prepareTradingReducer } from '@suite-common/trading';
import { deviceActions } from '@suite-common/wallet-core';
import { tradingInitialState } from '@suite-native/trading-consts';

import { TRADING_BUY, buyActions, buyReducer } from './buySlice';
import { TRADING_EXCHANGE, exchangeActions, exchangeReducer } from './exchangeSlice';
import { TRADING_RESIDENCE, residenceReducer } from './residenceSlice';
import { TRADING_SELL, sellActions, sellReducer } from './sellSlice';

export const tradingSlice = createSliceWithExtraDeps({
    name: 'trading',
    initialState: tradingInitialState,
    reducers: {
        addTradeableAssetToFavourites: (state, { payload }: PayloadAction<CryptoId>) => {
            state.favouriteAssets[payload] = true;
        },
        removeTradeableAssetFromFavourites: (state, { payload }: PayloadAction<CryptoId>) => {
            delete state.favouriteAssets[payload];
        },
        setTradingEnvironment: (state, { payload }: PayloadAction<InvityServerEnvironment>) => {
            state.tradingEnvironment = payload;
            state.tradeOrderIdToBeOpened = undefined;
            buyReducer(state.buy, buyActions.clearState());
            exchangeReducer(state.exchange, exchangeActions.clearState());
            sellReducer(state.sell, sellActions.clearState());
        },
        setTradeOrderIdToBeOpened: (state, { payload }: PayloadAction<string>) => {
            state.tradeOrderIdToBeOpened = payload;
        },
        clearTradeOrderIdToBeOpened: state => {
            state.tradeOrderIdToBeOpened = undefined;
        },
        setIsAmountInputActive: (state, { payload }: PayloadAction<boolean>) => {
            state.isAmountInputActive = payload;
        },
        setActiveTradingType: (state, { payload }: PayloadAction<TradingType>) => {
            state.activeTradingType = payload;
        },
        clearActiveTradingType: state => {
            state.activeTradingType = undefined;
        },
    },
    extraReducers: (builder, extra) => {
        const commonTradingFormReducer = prepareTradingReducer(extra);
        builder
            .addCase(deviceActions.selectDevice, state => {
                state.buy.tradingAccountKey = undefined;
                state.buy.receiveAddress = undefined;
                state.exchange.tradingAccountKey = undefined;
                state.exchange.receiveAccountKey = undefined;
                state.exchange.receiveAddress = undefined;
                state.sell.tradingAccountKey = undefined;
            })
            .addMatcher(
                isAnyOf(buyActions.clearState, exchangeActions.clearState, sellActions.clearState),
                state => {
                    state.tradeOrderIdToBeOpened = undefined;
                },
            )
            .addMatcher(
                action => action.type.startsWith(TRADING_BUY),
                (state, action) => {
                    buyReducer(state.buy, action);
                },
            )
            .addMatcher(
                action => action.type.startsWith(TRADING_EXCHANGE),
                (state, action) => {
                    exchangeReducer(state.exchange, action);
                },
            )
            .addMatcher(
                action => action.type.startsWith(TRADING_SELL),
                (state, action) => {
                    sellReducer(state.sell, action);
                },
            )
            .addMatcher(
                action => action.type.startsWith(TRADING_RESIDENCE),
                (state, action) => {
                    residenceReducer(state.residence, action);
                },
            )
            // In case that this reducer does not match the action, try to handle it by suite-common tradingReducer.
            .addDefaultCase((state, action) => {
                commonTradingFormReducer(state, action);
            });
    },
});

export const tradingActions = tradingSlice.actions;
