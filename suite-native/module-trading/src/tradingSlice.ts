import { PayloadAction } from '@reduxjs/toolkit';
import { CryptoId } from 'invity-api';

import { createSliceWithExtraDeps } from '@suite-common/redux-utils';
import {
    TradingExchangeState as CommonTradingExchangeState,
    TradingState as CommonTradingState,
    InvityServerEnvironment,
    TradingType,
    initialState as commonInitialState,
    prepareTradingReducer,
} from '@suite-common/trading';
import { deviceActions } from '@suite-common/wallet-core';
import { Address } from '@trezor/blockchain-link-types';

import { TRADING_BUY, TradingBuyState, buyActions, buyInitialState, buyReducer } from './buySlice';

export interface TradingExchangeState extends CommonTradingExchangeState {
    receiveAddress: Address | undefined;
}

export interface TradingState extends CommonTradingState {
    buy: TradingBuyState;
    exchange: TradingExchangeState;
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
    exchange: { ...commonInitialState.exchange, receiveAddress: undefined },
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
        setExchangeReceiveAddress: (state, { payload }: PayloadAction<Address | undefined>) => {
            state.exchange.receiveAddress = payload;
        },
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
                state.exchange.receiveAccountKey = undefined;
                state.exchange.receiveAddress = undefined;
            })
            .addCase(buyActions.clearState, state => {
                state.tradeOrderIdToBeOpened = undefined;
            })
            .addMatcher(
                action => action.type.startsWith(TRADING_BUY),
                (state, action) => {
                    buyReducer(state.buy, action);
                },
            )
            // In case that this reducer does not match the action, try to handle it by suite-common tradingReducer.
            .addDefaultCase((state, action) => {
                commonTradingFormReducer(state, action);
            });
    },
});

export const tradingActions = tradingSlice.actions;
