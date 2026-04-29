import { type PayloadAction, isAnyOf } from '@reduxjs/toolkit';

import { createSliceWithExtraDeps } from '@suite-common/redux-utils';
import {
    type InvityServerEnvironment,
    type TradingTypeWithConcierge,
    prepareTradingReducer,
} from '@suite-common/trading';
import { tradingInitialState } from '@suite-native/trading-consts';
import type { ProviderConfirmationStatus } from '@suite-native/trading-types';

import { TRADING_BUY, buyActions, buyReducer } from './buySlice';
import { TRADING_EXCHANGE, exchangeActions, exchangeReducer } from './exchangeSlice';
import { TRADING_RESIDENCE, residenceReducer } from './residenceSlice';
import { TRADING_SELL, sellActions, sellReducer } from './sellSlice';

const providerConfirmationStatusTransitions: Record<
    ProviderConfirmationStatus,
    ProviderConfirmationStatus[]
> = {
    // inactive is the initial state, providerConfirmationStatus becomes inactive when transaction preview is closed
    inactive: ['window_opened'],
    // window_opened is set when the webview/browser is opened
    window_opened: [
        'window_closed_incomplete',
        'window_closed_with_success',
        'confirmation_success',
        'inactive',
    ],
    // window_closed_incomplete is set when the webview/browser is closed manually by the user before completing the confirmation
    window_closed_incomplete: [
        'window_closed_with_success',
        'confirmation_success',
        'confirmation_failed',
        'inactive',
    ],
    // window_closed_with_success is set when the webview/browser is closed after successful confirmation
    window_closed_with_success: ['confirmation_success', 'confirmation_failed', 'inactive'],
    // confirmation_failed is set if we do not know transaction status after 30 seconds after webview/browser is closed
    confirmation_failed: ['confirmation_success', 'inactive'],
    // confirmation_success is set when provider confirms transaction
    confirmation_success: ['inactive'],
};

export const tradingSlice = createSliceWithExtraDeps({
    name: 'trading',
    initialState: tradingInitialState,
    reducers: {
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
        setActiveTradingType: (state, { payload }: PayloadAction<TradingTypeWithConcierge>) => {
            state.activeTradingType = payload;
        },
        clearActiveTradingType: state => {
            state.activeTradingType = undefined;
        },
        setProviderConfirmationStatus: (
            state,
            { payload: newStatus }: PayloadAction<ProviderConfirmationStatus>,
        ) => {
            const currentStatus = state.providerConfirmationStatus;

            if (
                // this case should never happen, but allows to recover from an invalid state
                !Object.hasOwn(providerConfirmationStatusTransitions, currentStatus) ||
                // allow only valid transitions, ignore rest
                providerConfirmationStatusTransitions[currentStatus].includes(newStatus)
            ) {
                state.providerConfirmationStatus = newStatus;
            }
        },
        clearSelectedAccounts: state => {
            state.buy.tradingAccountKey = undefined;
            state.buy.receiveAccountKey = undefined;
            state.buy.receiveAddress = undefined;
            state.exchange.tradingAccountKey = undefined;
            state.exchange.receiveAccountKey = undefined;
            state.exchange.receiveAddress = undefined;
            state.sell.tradingAccountKey = undefined;
        },
    },
    extraReducers: (builder, extra) => {
        const commonTradingFormReducer = prepareTradingReducer(extra);
        builder
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
