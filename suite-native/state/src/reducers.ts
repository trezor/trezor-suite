import { combineReducers } from '@reduxjs/toolkit';

import { deviceAuthorizationReducer } from '@suite-native/device-authorization';
import {
    feesReducer,
    prepareAccountsReducer,
    prepareBlockchainReducer,
    prepareDeviceReducer,
    prepareDiscoveryReducer,
    prepareFiatRatesReducer,
    prepareSendFormReducer,
    prepareTransactionsReducer,
} from '@suite-common/wallet-core';
import { appSettingsReducer, appSettingsPersistWhitelist } from '@suite-native/settings';
import { logsSlice } from '@suite-common/logger';
import {
    migrateAccountLabel,
    deriveAccountTypeFromPaymentType,
    preparePersistReducer,
    walletPersistTransform,
    devicePersistTransform,
    walletStopPersistTransform,
} from '@suite-native/storage';
import { prepareAnalyticsReducer } from '@suite-common/analytics';
import {
    messageSystemPersistedWhitelist,
    prepareMessageSystemReducer,
} from '@suite-common/message-system';
import { notificationsReducer } from '@suite-common/toast-notifications';
import { graphReducer, graphPersistTransform } from '@suite-native/graph';
import { discoveryConfigPersistWhitelist, discoveryConfigReducer } from '@suite-native/discovery';
import { featureFlagsPersistedKeys, featureFlagsReducer } from '@suite-native/feature-flags';
import { prepareTokenDefinitionsReducer } from '@suite-common/token-definitions';
import { passphraseReducer } from '@suite-native/passphrase';

import { extraDependencies } from './extraDependencies';
import { appReducer } from './appSlice';

const transactionsReducer = prepareTransactionsReducer(extraDependencies);
const accountsReducer = prepareAccountsReducer(extraDependencies);
const fiatRatesReducer = prepareFiatRatesReducer(extraDependencies);
const blockchainReducer = prepareBlockchainReducer(extraDependencies);
const analyticsReducer = prepareAnalyticsReducer(extraDependencies);
const messageSystemReducer = prepareMessageSystemReducer(extraDependencies);
const deviceReducer = prepareDeviceReducer(extraDependencies);
const discoveryReducer = prepareDiscoveryReducer(extraDependencies);
const tokenDefinitionsReducer = prepareTokenDefinitionsReducer(extraDependencies);
const sendFormReducer = prepareSendFormReducer(extraDependencies);

export const prepareRootReducers = async () => {
    const appSettingsPersistedReducer = await preparePersistReducer({
        reducer: appSettingsReducer,
        persistedKeys: appSettingsPersistWhitelist,
        key: 'appSettings',
        version: 1,
    });

    const walletReducers = combineReducers({
        accounts: accountsReducer,
        blockchain: blockchainReducer,
        fiat: fiatRatesReducer,
        transactions: transactionsReducer,
        discovery: discoveryReducer,
        send: sendFormReducer,
        fees: feesReducer,
    });

    const walletPersistedReducer = await preparePersistReducer({
        reducer: walletReducers,
        persistedKeys: ['accounts', 'transactions'],
        key: 'wallet',
        version: 3,
        migrations: {
            2: (oldState: any) => {
                if (!oldState.accounts) return oldState;

                const oldAccountsState: { accounts: any } = { accounts: oldState.accounts };
                const migratedAccounts = migrateAccountLabel(oldAccountsState.accounts);
                const migratedState = { ...oldState, accounts: migratedAccounts };

                return migratedState;
            },
            3: oldState => {
                if (!oldState.accounts) return oldState;

                const oldAccountsState: { accounts: any } = { accounts: oldState.accounts };
                const migratedAccounts = deriveAccountTypeFromPaymentType(
                    oldAccountsState.accounts,
                );
                const migratedState = { ...oldState, accounts: migratedAccounts };

                return migratedState;
            },
        },
        transforms: [walletStopPersistTransform],
        // This remains for backward compatibility. If any data was persisted under the 'wallet' key,
        // it is retrieved from storage and migrated. Subsequently, the 'wallet' key is cleared because
        // the data is now stored under the 'root' key.
    });

    const analyticsPersistedReducer = await preparePersistReducer({
        reducer: analyticsReducer,
        persistedKeys: ['instanceId', 'enabled', 'confirmed'],
        key: 'analytics',
        version: 1,
    });

    const devicePersistedReducer = await preparePersistReducer({
        reducer: deviceReducer,
        persistedKeys: ['devices'],
        key: 'devices',
        version: 1,
        transforms: [devicePersistTransform],
    });

    const discoveryConfigPersistedReducer = await preparePersistReducer({
        reducer: discoveryConfigReducer,
        persistedKeys: discoveryConfigPersistWhitelist,
        key: 'discoveryConfig',
        version: 1,
    });

    const featureFlagsPersistedReducer = await preparePersistReducer({
        reducer: featureFlagsReducer,
        persistedKeys: featureFlagsPersistedKeys,
        key: 'featureFlags',
        version: 1,
    });

    const messageSystemPersistedReducer = await preparePersistReducer({
        reducer: messageSystemReducer,
        persistedKeys: messageSystemPersistedWhitelist,
        key: 'messageSystem',
        version: 1,
    });

    const rootReducer = await preparePersistReducer({
        reducer: combineReducers({
            app: appReducer,
            analytics: analyticsPersistedReducer,
            appSettings: appSettingsPersistedReducer,
            wallet: walletPersistedReducer,
            featureFlags: featureFlagsPersistedReducer,
            graph: graphReducer,
            device: devicePersistedReducer,
            deviceAuthorization: deviceAuthorizationReducer,
            logs: logsSlice.reducer,
            notifications: notificationsReducer,
            discoveryConfig: discoveryConfigPersistedReducer,
            messageSystem: messageSystemPersistedReducer,
            tokenDefinitions: tokenDefinitionsReducer,
            passphrase: passphraseReducer,
        }),
        // 'wallet' and 'graph' need to be persisted at the top level to ensure device state
        // is accessible for transformation.
        persistedKeys: ['wallet', 'graph'],
        transforms: [walletPersistTransform, graphPersistTransform],
        mergeLevel: 2,
        key: 'root',
        version: 1,
    });

    return rootReducer;
};
