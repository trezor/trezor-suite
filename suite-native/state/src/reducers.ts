import { combineReducers } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';

import {
    prepareAccountsReducer,
    prepareBlockchainReducer,
    prepareFiatRatesReducer,
    prepareTransactionsReducer,
} from '@suite-common/wallet-core';
import { devicesReducer } from '@suite-native/module-devices';
import { appSettingsReducer, appSettingsPersistWhitelist } from '@suite-native/module-settings';

import { extraDependencies } from './extraDependencies';
import { reduxStorage } from './storage';

const transactionsReducer = prepareTransactionsReducer(extraDependencies);
const accountsReducer = prepareAccountsReducer(extraDependencies);
const fiatRatesReducer = prepareFiatRatesReducer(extraDependencies);
const blockchainReducer = prepareBlockchainReducer(extraDependencies);

export const appSettingsPersistConfig = {
    key: 'appSettings',
    storage: reduxStorage,
    whitelist: appSettingsPersistWhitelist,
};

export const walletPersistConfig = {
    key: 'wallet',
    storage: reduxStorage,
    whitelist: ['accounts', 'transactions'],
};

export const walletReducers = combineReducers({
    accounts: accountsReducer,
    blockchain: blockchainReducer,
    fiat: fiatRatesReducer,
    transactions: transactionsReducer,
});

export const rootReducers = combineReducers({
    appSettings: persistReducer(appSettingsPersistConfig, appSettingsReducer),
    devices: devicesReducer,
    wallet: persistReducer(walletPersistConfig, walletReducers),
});
