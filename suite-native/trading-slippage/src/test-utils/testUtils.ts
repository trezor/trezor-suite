import type { ReactElement } from 'react';

import { type Store, combineReducers } from '@reduxjs/toolkit';
import type { ExchangeTrade } from 'invity-api';

import { mockActionType } from '@suite-common/redux-utils/mocks';
import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { type LocaleSliceRootState, localeInitialState, localeReducer } from '@suite-native/intl';
import {
    type RenderHookResult,
    type RenderResult,
    createLightStore,
    createStaticReducer,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
} from '@suite-native/test-utils-store';
import { getInitializedTradingState, mercuryoDexQuote } from '@suite-native/trading-fixtures';
import { type TradingRootState, tradingSlice } from '@suite-native/trading-state';

type State = TradingRootState & LocaleSliceRootState;

type SlippageTestOptions = {
    store?: Store<State>;
    quote?: ExchangeTrade;
};

const reducer = {
    locale: localeReducer,
    wallet: combineReducers({
        settings: createStaticReducer(initialWalletSettingsState),
        trading: tradingSlice.prepareReducer({
            actionTypes: { storageLoad: mockActionType('storageLoad') },
        }),
    }),
} as const;

export const getSlippageTestPreloadedState = (
    quote: ExchangeTrade | undefined = mercuryoDexQuote,
): State => {
    const trading = getInitializedTradingState();
    trading.exchange.selectedQuote = quote;

    return {
        locale: localeInitialState,
        wallet: { trading },
    };
};

export const createSlippageTestStore = (quote: ExchangeTrade | undefined = mercuryoDexQuote) =>
    createLightStore({
        reducer,
        preloadedState: getSlippageTestPreloadedState(quote),
    });

export const renderWithSlippageTestProvider = (
    element: ReactElement,
    { store, quote }: SlippageTestOptions = {},
): Promise<RenderResult> => {
    const preloadedState = store ? undefined : getSlippageTestPreloadedState(quote);

    return renderWithStoreProvider(element, { preloadedState, services: { store } });
};

export const renderHookWithSlippageTestProvider = <Result>(
    callback: () => Result,
    { store, quote }: SlippageTestOptions = {},
): Promise<RenderHookResult<Result, unknown>> => {
    const preloadedState = store ? undefined : getSlippageTestPreloadedState(quote);

    return renderHookWithStoreProvider(callback, { preloadedState, services: { store } });
};
