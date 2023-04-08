import { combineReducers } from '@reduxjs/toolkit';

import {
    prepareAccountsReducer,
    prepareBlockchainReducer,
    prepareTransactionsReducer,
} from '@suite-common/wallet-core';
import { prepareFiatRatesReducer } from '@suite-native/fiat-rates';
import { devicesReducer } from '@suite-native/module-devices';
import { appSettingsReducer, appSettingsPersistWhitelist } from '@suite-native/module-settings';
import { logsSlice } from '@suite-common/logger';
import { preparePersistReducer } from '@suite-native/storage';
import { prepareAnalyticsReducer } from '@suite-common/analytics';
import { notificationsReducer } from '@suite-common/toast-notifications';

import { extraDependencies } from './extraDependencies';
import { appReducer } from './appSlice';

const transactionsReducer = prepareTransactionsReducer(extraDependencies);
const accountsReducer = prepareAccountsReducer(extraDependencies);
const fiatRatesReducer = prepareFiatRatesReducer(extraDependencies);
const blockchainReducer = prepareBlockchainReducer(extraDependencies);
const analyticsReducer = prepareAnalyticsReducer(extraDependencies);

export const prepareRootReducers = async () => {
    const appSettingsPersistedReducer = await preparePersistReducer({
        reducer: appSettingsReducer,
        persistedKeys: appSettingsPersistWhitelist,
        key: 'appSettings',
    });

    const walletReducers = combineReducers({
        accounts: accountsReducer,
        blockchain: blockchainReducer,
        fiat: fiatRatesReducer,
        transactions: transactionsReducer,
    });

    const walletPersistedReducer = await preparePersistReducer({
        reducer: walletReducers,
        persistedKeys: ['accounts', 'transactions'],
        key: 'wallet',
    });

    return combineReducers({
        app: appReducer,
        analytics: analyticsReducer,
        appSettings: appSettingsPersistedReducer,
        wallet: walletPersistedReducer,
        devices: devicesReducer,
        logs: logsSlice.reducer,
        notifications: notificationsReducer,
    });
};
