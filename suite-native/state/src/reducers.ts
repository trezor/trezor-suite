import { combineReducers } from '@reduxjs/toolkit';

import {
    prepareAccountsReducer,
    prepareBlockchainReducer,
    prepareFiatRatesReducer,
    prepareTransactionsReducer,
} from '@suite-common/wallet-core';
import { devicesReducer } from '@suite-native/module-devices';
import { appSettingsReducer, appSettingsPersistWhitelist } from '@suite-native/module-settings';
import { preparePersistReducer } from '@suite-native/storage';

import { extraDependencies } from './extraDependencies';

const transactionsReducer = prepareTransactionsReducer(extraDependencies);
const accountsReducer = prepareAccountsReducer(extraDependencies);
const fiatRatesReducer = prepareFiatRatesReducer(extraDependencies);
const blockchainReducer = prepareBlockchainReducer(extraDependencies);

const appSettingsPersistedReducer = preparePersistReducer({
    reducer: appSettingsReducer,
    persistedKeys: appSettingsPersistWhitelist,
    key: 'appSettings',
});

export const walletReducers = combineReducers({
    accounts: accountsReducer,
    blockchain: blockchainReducer,
    fiat: fiatRatesReducer,
    transactions: transactionsReducer,
});

const walletPersistedReducer = preparePersistReducer({
    reducer: walletReducers,
    persistedKeys: ['accounts', 'transactions'],
    key: 'wallet',
});

export const rootReducers = combineReducers({
    appSettings: appSettingsPersistedReducer,
    devices: devicesReducer,
    wallet: walletPersistedReducer,
});
