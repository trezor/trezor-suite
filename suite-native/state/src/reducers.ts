import { combineReducers } from '@reduxjs/toolkit';

import {
    prepareAccountsReducer,
    prepareBlockchainReducer,
    prepareFiatRatesReducer,
    prepareTransactionsReducer,
} from '@suite-common/wallet-core';
import { devicesReducer } from '@suite-native/module-devices';
import { accountsImportReducer } from '@suite-native/module-accounts-import';
import { appSettingsReducer, appSettingsPersistWhitelist } from '@suite-native/module-settings';
import { typedPersistReducer } from '@suite-native/storage';

import { extraDependencies } from './extraDependencies';

const transactionsReducer = prepareTransactionsReducer(extraDependencies);
const accountsReducer = prepareAccountsReducer(extraDependencies);
const fiatRatesReducer = prepareFiatRatesReducer(extraDependencies);
const blockchainReducer = prepareBlockchainReducer(extraDependencies);

const appSettingsPersistedReducer = typedPersistReducer({
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

const walletPersistedReducer = typedPersistReducer({
    reducer: walletReducers,
    persistedKeys: ['accounts', 'transactions'],
    key: 'wallet',
});

export const rootReducers = combineReducers({
    appSettings: appSettingsPersistedReducer,
    devices: devicesReducer,
    wallet: walletPersistedReducer,
    accountsImport: accountsImportReducer,
});
