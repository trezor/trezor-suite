import { PayloadAction, isAnyOf } from '@reduxjs/toolkit';
import { CryptoId } from 'invity-api';

import { createSliceWithExtraDeps } from '@suite-common/redux-utils';
import {
    TradingState as CommonTradingState,
    InvityServerEnvironment,
    TradingType,
    initialState as commonInitialState,
    prepareTradingReducer,
} from '@suite-common/trading';
import { deviceActions } from '@suite-common/wallet-core';

import { TRADING_BUY, TradingBuyState, buyActions, buyInitialState, buyReducer } from './buySlice';
import {
    TRADING_EXCHANGE,
    TradingExchangeState,
    exchangeActions,
    exchangeInitialState,
    exchangeReducer,
} from './exchangeSlice';
import {
    TRADING_SELL,
    TradingSellState,
    sellActions,
    sellInitialState,
    sellReducer,
} from './sellSlice';

export interface TradingState extends CommonTradingState {
    buy: TradingBuyState;
    exchange: TradingExchangeState;
    sell: TradingSellState;
    favouriteAssets: Record<CryptoId, true>;
    tradingEnvironment: InvityServerEnvironment;
    tradeOrderIdToBeOpened: string | undefined;
    isAmountInputActive: boolean;
    activeTradingType: TradingType | undefined;
}

export type TradingRootState = {
    wallet: {
        tradingNew: TradingState;
    };
};

export const initialState: TradingState = {
    ...commonInitialState,
    buy: buyInitialState,
    exchange: exchangeInitialState,
    sell: sellInitialState,
    favouriteAssets: {},
    tradingEnvironment: 'production',
    tradeOrderIdToBeOpened: undefined,
    isAmountInputActive: false,
    activeTradingType: undefined,
};

export const tradingSlice = createSliceWithExtraDeps({
    name: 'trading',
    initialState,
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
            // In case that this reducer does not match the action, try to handle it by suite-common tradingReducer.
            .addDefaultCase((state, action) => {
                commonTradingFormReducer(state, action);
            });
    },
});

export const tradingActions = tradingSlice.actions;
