import { combineReducers, configureStore, Store, Middleware } from '@reduxjs/toolkit';
import createDebugger from 'redux-flipper';

import { appSettingsReducer } from '@suite-native/module-settings';
import { appGraphReducer } from '@suite-native/home-graph';
import { onboardingReducer, prepareDevicesReducer } from '@suite-native/module-onboarding';
import {
    prepareAccountsReducer,
    prepareFiatRatesReducer,
    prepareTransactionsReducer,
} from '@suite-common/wallet-core';

import { extraDependencies } from './extraDependencies';

const middlewares: Middleware[] = [];

if (__DEV__) {
    const reduxFlipperDebugger = createDebugger();
    middlewares.push(reduxFlipperDebugger);
}

export const transactionsReducer = prepareTransactionsReducer(extraDependencies);
export const accountsReducer = prepareAccountsReducer(extraDependencies);
export const fiatRatesReducer = prepareFiatRatesReducer(extraDependencies);
export const devicesReducer = prepareDevicesReducer(extraDependencies);

const walletReducers = combineReducers({
    accounts: accountsReducer,
    fiat: fiatRatesReducer,
    transactions: transactionsReducer,
});

export const store: Store = configureStore({
    reducer: {
        onboarding: onboardingReducer,
        appSettings: appSettingsReducer,
        appGraph: appGraphReducer,
        devices: devicesReducer,
        wallet: walletReducers,
    },
    middleware: getDefaultMiddleware =>
        getDefaultMiddleware({
            thunk: {
                extraArgument: extraDependencies,
            },
        }).concat(middlewares),
});

export type RootState = ReturnType<typeof store.getState>;
