import { combineReducers, configureStore, Store } from '@reduxjs/toolkit';

import { appSettingsReducer } from '@suite-native/module-settings';
import { appGraphReducer } from '@suite-native/home-graph';
import { onboardingReducer } from '@suite-native/module-onboarding';
import {
    prepareAccountsReducer,
    prepareFiatRatesReducer,
    prepareTransactionsReducer,
} from '@suite-common/wallet-core';

import { extraDependencies } from './extraDependencies';

export const transactionsReducer = prepareTransactionsReducer(extraDependencies);
export const accountsReducer = prepareAccountsReducer(extraDependencies);
export const fiatRatesReducer = prepareFiatRatesReducer(extraDependencies);

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
        wallet: walletReducers,
    },
    middleware: getDefaultMiddleware =>
        getDefaultMiddleware({
            thunk: {
                extraArgument: extraDependencies,
            },
        }),
});

export type RootState = ReturnType<typeof store.getState>;
