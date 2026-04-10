import { combineReducers } from '@reduxjs/toolkit';
import { getStoredState } from 'redux-persist';

import { prepareAnalyticsReducer } from '@suite-common/analytics-redux';
import { prepareConnectPopupReducer } from '@suite-common/connect-popup';
import { prepareDeviceReducer } from '@suite-common/device';
import { prepareFirmwareReducer } from '@suite-common/firmware';
import { geolocationReducer } from '@suite-common/geolocation';
import { logsSlice } from '@suite-common/logger';
import {
    messageSystemPersistedWhitelist,
    prepareMessageSystemReducer,
} from '@suite-common/message-system';
import { suiteSyncDataReducer, suiteSyncReducer } from '@suite-common/suite-sync';
import { suiteSyncQuotaManagerReducer } from '@suite-common/suite-sync-quota-manager';
import { prepareThpReducer } from '@suite-common/thp';
import { createNotificationsReducer } from '@suite-common/toast-notifications';
import { prepareTokenDefinitionsReducer } from '@suite-common/token-definitions';
import {
    feesReducer,
    formDraftReducer,
    prepareAccountsReducer,
    prepareBlockchainReducer,
    prepareDiscoveryReducer,
    prepareExplorerReducer,
    prepareFiatRatesReducer,
    preparePhishingReducer,
    prepareStakeReducer,
    prepareTransactionsReducer,
    prepareWalletSettingsReducer,
    walletSettingsPersistedWhitelist,
} from '@suite-common/wallet-core';
// Suite Native has circular in @suite-native/test-utils -> @suite-native/state -> ... -> @suite-native/test-utils
// This is causing problems handling types in WalletConnect, so we import the reducer directly instead of the whole module
// eslint-disable-next-line local-rules/no-package-deep-imports
import { prepareWalletConnectReducer } from '@suite-common/walletconnect/src/walletConnectReducer';
import { bannerFlagsPersistWhitelist, bannerFlagsReducer } from '@suite-native/banner-flags';
import { bluetoothSlice } from '@suite-native/bluetooth';
import { deviceAuthorizationReducer } from '@suite-native/device-authorization';
import { deviceOnboardingReducer } from '@suite-native/device-onboarding';
import { pendingCoinVisibilitySlice } from '@suite-native/discovery';
import { featureFeedbackReducer } from '@suite-native/feature-feedback';
import { featureFlagsPersistedKeys, featureFlagsReducer } from '@suite-native/feature-flags';
import { nativeFirmwareReducer } from '@suite-native/firmware';
import { graphPersistTransform, graphReducer } from '@suite-native/graph';
import { type TxKeyPath, localePersistWhitelist, localeReducer } from '@suite-native/intl';
import { appSettingsPersistWhitelist, appSettingsReducer } from '@suite-native/settings';
import {
    type MMKVStorageDep,
    backfillDeviceAuthenticityChecks,
    backfillPortfolioTrackerUnavailableCapabilities,
    blockchainPersistTransform,
    bluetoothPersistTransform,
    deriveAccountTypeFromPaymentType,
    devicePersistTransform,
    initialMigrateAppSettingsAndDiscoveryConfig,
    migrateAccountBnbToBsc,
    migrateAccountLabel,
    migrateAccountsDeprecateNetworks,
    migrateAutoEjectToWalletSettings,
    migrateDeviceState,
    migrateLocaleTagToAppLocaleCode,
    migrateTransactionsBnbToBsc,
    migrateTransactionsDeprecateNetworks,
    preparePersistReducer,
    walletPersistTransform,
    walletStopPersistTransform,
} from '@suite-native/storage';
import { tradingInitialState, tradingSlice } from '@suite-native/trading-state';
import { sendFormSlice } from '@suite-native/transaction-management';

import { appReducer } from './appSlice';
import { extraDependencies } from './extraDependencies';

const transactionsReducer = prepareTransactionsReducer(extraDependencies);
const phishingReducer = preparePhishingReducer(extraDependencies);
const accountsReducer = prepareAccountsReducer(extraDependencies);
const fiatRatesReducer = prepareFiatRatesReducer(extraDependencies);
const blockchainReducer = prepareBlockchainReducer(extraDependencies);
const explorerReducer = prepareExplorerReducer(extraDependencies);
const analyticsReducer = prepareAnalyticsReducer(extraDependencies);
const messageSystemReducer = prepareMessageSystemReducer(extraDependencies);
const deviceReducer = prepareDeviceReducer(extraDependencies);
const discoveryReducer = prepareDiscoveryReducer(extraDependencies);
const tokenDefinitionsReducer = prepareTokenDefinitionsReducer(extraDependencies);
const sendFormReducer = sendFormSlice.prepareReducer(extraDependencies);
const tradingReducer = tradingSlice.prepareReducer(extraDependencies);
const stakeReducer = prepareStakeReducer(extraDependencies);
const firmwareReducer = prepareFirmwareReducer(extraDependencies);
const connectPopupReducer = prepareConnectPopupReducer(extraDependencies);
const walletConnectReducer = prepareWalletConnectReducer(extraDependencies);
const walletSettingsReducer = prepareWalletSettingsReducer(extraDependencies);
const bluetoothReducer = bluetoothSlice.prepareReducer(extraDependencies);
const thpReducer = prepareThpReducer(extraDependencies);

type PrepareRootReducersDeps = MMKVStorageDep;

export const prepareRootReducers = (deps: PrepareRootReducersDeps) => {
    const appSettingsPersistedReducer = preparePersistReducer({
        reducer: appSettingsReducer,
        persistedKeys: appSettingsPersistWhitelist,
        key: 'appSettings',
        // Note: Migrations have been removed.
        // To version 3: The `isCoinEnablingInitFinished` property was deleted, and
        // `areTestnetsEnabled` is a developer-only option and does not require migration.
        // To version 2: moved to initialMigrateAppSettingsAndDiscoveryConfig
        version: 3,
        storage: deps.mmkvStorage,
    });

    const blockchainPersistedReducer = preparePersistReducer({
        reducer: blockchainReducer,
        persistedKeys: ['btc'],
        key: 'blockchain',
        version: 1,
        transforms: [blockchainPersistTransform],
        storage: deps.mmkvStorage,
    });

    const tradingPersistedReducer = preparePersistReducer({
        reducer: tradingReducer,
        persistedKeys: ['favouriteAssets', 'trades', 'settings', 'residence', 'tradingEnvironment'],
        key: 'trading',
        version: 2,
        migrations: {
            2: (oldState: any /* FIXME */) => {
                if (!oldState) return oldState;

                return {
                    ...oldState,
                    residence: tradingInitialState.residence,
                };
            },
        },
        storage: deps.mmkvStorage,
    });

    const walletSettingsPersistedReducer = preparePersistReducer({
        reducer: walletSettingsReducer,
        persistedKeys: walletSettingsPersistedWhitelist,
        key: 'walletSettings',
        version: 1,
        migrations: {
            1: initialMigrateAppSettingsAndDiscoveryConfig({
                mmkvStorage: deps.mmkvStorage,
                getStoredState,
            }),
            2: migrateAutoEjectToWalletSettings({
                mmkvStorage: deps.mmkvStorage,
                getStoredState,
            }),
        },
        storage: deps.mmkvStorage,
    });

    const phishingPersistedReducer = preparePersistReducer({
        reducer: phishingReducer,
        persistedKeys: ['dustPhishing'],
        key: 'phishingMetadata',
        version: 1,
        storage: deps.mmkvStorage,
    });

    const walletReducers = combineReducers({
        accounts: accountsReducer,
        blockchain: blockchainPersistedReducer,
        explorer: explorerReducer,
        fiat: fiatRatesReducer,
        transactions: transactionsReducer,
        phishing: phishingPersistedReducer,
        discovery: discoveryReducer,
        send: sendFormReducer,
        fees: feesReducer,
        stake: stakeReducer,
        trading: tradingPersistedReducer,
        settings: walletSettingsPersistedReducer,
        formDrafts: formDraftReducer,
    });

    const walletPersistedReducer = preparePersistReducer({
        reducer: walletReducers,
        persistedKeys: ['accounts', 'transactions'],
        key: 'wallet',
        version: 3,
        migrations: {
            2: (oldState: any /* FIXME */) => {
                if (!oldState?.accounts) return oldState;

                const oldAccountsState: { accounts: any } = { accounts: oldState.accounts };
                const migratedAccounts = migrateAccountLabel(oldAccountsState.accounts);
                const migratedState = { ...oldState, accounts: migratedAccounts };

                return migratedState;
            },
            3: (oldState: any /* FIXME */) => {
                if (!oldState?.accounts) return oldState;

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
        storage: deps.mmkvStorage,
    });

    const analyticsPersistedReducer = preparePersistReducer({
        reducer: analyticsReducer,
        persistedKeys: [
            'instanceId',
            'enabled',
            'confirmed',
            'customAnalyticsUrl',
            'loggerEnabled',
        ],
        key: 'analytics',
        version: 1,
        storage: deps.mmkvStorage,
    });

    const devicePersistedReducer = preparePersistReducer({
        reducer: deviceReducer,
        persistedKeys: ['devices', 'persistentDeviceData'],
        key: 'devices',
        version: 4,
        transforms: [devicePersistTransform],
        migrations: {
            2: (oldState: any /* FIXME */) => {
                if (!oldState?.devices) return oldState;

                const oldDevicesState: { devices: any } = { devices: oldState.devices };
                const migratedDevices = migrateDeviceState(oldDevicesState.devices);
                const migratedState = { ...oldState, devices: migratedDevices };

                return migratedState;
            },
            3: (oldState: any /* FIXME */) => {
                if (!oldState?.devices) return oldState;
                const migratedDevices = backfillDeviceAuthenticityChecks(oldState.devices);

                return { ...oldState, devices: migratedDevices };
            },
            4: (oldState: any /* FIXME */) => {
                if (!oldState?.devices) return oldState;
                const migratedDevices = backfillPortfolioTrackerUnavailableCapabilities(
                    oldState.devices,
                );

                return { ...oldState, devices: migratedDevices };
            },
        },
        storage: deps.mmkvStorage,
    });

    const featureFlagsPersistedReducer = preparePersistReducer({
        reducer: featureFlagsReducer,
        persistedKeys: featureFlagsPersistedKeys,
        key: 'featureFlags',
        version: 2,
        // migration to v2 for IsDeviceConnectEnabled and IsBluetoothEnabled removed as obsolete
        storage: deps.mmkvStorage,
    });

    const bannerFlagsPersistedReducer = preparePersistReducer({
        reducer: bannerFlagsReducer,
        persistedKeys: bannerFlagsPersistWhitelist,
        key: 'bannerFlags',
        version: 1,
        storage: deps.mmkvStorage,
    });

    const featureFeedbackPersistedReducer = preparePersistReducer({
        reducer: featureFeedbackReducer,
        persistedKeys: ['usageCounts', 'pendingFeedbackFeatures'],
        key: 'featureFeedback',
        version: 1,
        storage: deps.mmkvStorage,
    });

    const messageSystemPersistedReducer = preparePersistReducer({
        reducer: messageSystemReducer,
        persistedKeys: messageSystemPersistedWhitelist,
        key: 'messageSystem',
        version: 1,
        storage: deps.mmkvStorage,
    });

    const bluetoothPersistedReducer = preparePersistReducer({
        reducer: bluetoothReducer,
        persistedKeys: ['knownDevices'],
        key: 'bluetooth',
        version: 1,
        transforms: [bluetoothPersistTransform],
        storage: deps.mmkvStorage,
    });

    const connectPopupPersistedReducer = preparePersistReducer({
        reducer: connectPopupReducer,
        persistedKeys: ['permissions'],
        key: 'connectPopup',
        version: 1,
        storage: deps.mmkvStorage,
    });

    const firmwarePersistedReducer = preparePersistReducer({
        reducer: firmwareReducer,
        key: 'firmware',
        version: 1,
        persistedKeys: ['firmwareChannel'],
        storage: deps.mmkvStorage,
    });

    const thpPersistedReducer = preparePersistReducer({
        reducer: thpReducer,
        persistedKeys: ['credentials'],
        key: 'thp',
        version: 1,
        storage: deps.mmkvStorage,
    });

    const localePersistedReducer = preparePersistReducer({
        reducer: localeReducer,
        persistedKeys: localePersistWhitelist,
        key: 'locale',
        version: 2,
        migrations: {
            2: migrateLocaleTagToAppLocaleCode,
        },
        storage: deps.mmkvStorage,
    });

    const suiteSyncPersistedReducer = preparePersistReducer({
        reducer: suiteSyncReducer,
        persistedKeys: ['settings', 'suiteSyncOwners'],
        key: 'suiteSync',
        version: 1,
        storage: deps.mmkvStorage,
    });

    const quotaManagerPersistedReducer = preparePersistReducer({
        reducer: suiteSyncQuotaManagerReducer,
        persistedKeys: ['baseUrl', 'registeredDevices', 'ownersAllowance', 'enforceQuotaManager'],
        key: 'suiteSyncQuotaManager',
        version: 1,
        storage: deps.mmkvStorage,
    });

    const rootReducer = preparePersistReducer({
        reducer: combineReducers({
            analytics: analyticsPersistedReducer,
            app: appReducer,
            appSettings: appSettingsPersistedReducer,
            bannerFlags: bannerFlagsPersistedReducer,
            bluetooth: bluetoothPersistedReducer,
            featureFeedback: featureFeedbackPersistedReducer,
            connectPopup: connectPopupPersistedReducer,
            device: devicePersistedReducer,
            deviceAuthorization: deviceAuthorizationReducer,
            deviceOnboarding: deviceOnboardingReducer,
            featureFlags: featureFlagsPersistedReducer,
            firmware: firmwarePersistedReducer,
            geolocation: geolocationReducer,
            graph: graphReducer,
            locale: localePersistedReducer,
            logs: logsSlice.reducer,
            messageSystem: messageSystemPersistedReducer,
            nativeFirmware: nativeFirmwareReducer,
            notifications: createNotificationsReducer<TxKeyPath>().reducer,
            pendingCoinVisibility: pendingCoinVisibilitySlice.reducer,
            suiteSync: suiteSyncPersistedReducer,
            suiteSyncData: suiteSyncDataReducer,
            thp: thpPersistedReducer,
            tokenDefinitions: tokenDefinitionsReducer,
            wallet: walletPersistedReducer,
            walletConnect: walletConnectReducer,
            suiteSyncQuotaManager: quotaManagerPersistedReducer,
        } as const),
        // 'wallet' and 'graph' need to be persisted at the top level to ensure device state
        // is accessible for transformation.
        persistedKeys: ['wallet', 'graph'],
        transforms: [walletPersistTransform, graphPersistTransform],
        mergeLevel: 2,
        key: 'root',
        version: 3,
        migrations: {
            2: (oldState: any /* FIXME */) => {
                if (!oldState?.wallet) return oldState;

                const oldStateWallet = oldState.wallet;
                const migratedAccounts = migrateAccountBnbToBsc(oldStateWallet.accounts);

                const migratedTransactions = migrateTransactionsBnbToBsc(
                    oldStateWallet.transactions?.transactions,
                );

                const migratedState = {
                    ...oldState,
                    wallet: {
                        ...oldStateWallet,
                        accounts: migratedAccounts,
                        transactions: {
                            transactions: migratedTransactions,
                            phishing: oldStateWallet.transactions?.phishing ?? {},
                            fetchStatusDetail: oldStateWallet.transactions?.fetchStatusDetail,
                        },
                    },
                };

                return migratedState;
            },
            3: (oldState: any /* FIXME */) => {
                if (!oldState?.wallet) return oldState;

                const oldStateWallet = oldState.wallet;
                const migratedAccounts = migrateAccountsDeprecateNetworks(oldStateWallet.accounts);
                const migratedTransactions = migrateTransactionsDeprecateNetworks(
                    oldStateWallet.transactions?.transactions,
                );
                const migratedState = {
                    ...oldState,
                    wallet: {
                        ...oldStateWallet,
                        accounts: migratedAccounts,
                        transactions: {
                            transactions: migratedTransactions,
                            phishing: oldStateWallet.transactions?.phishing ?? {},
                            fetchStatusDetail: oldStateWallet.transactions?.fetchStatusDetail,
                        },
                    },
                };

                return migratedState;
            },
        },
        storage: deps.mmkvStorage,
    });

    return rootReducer;
};
