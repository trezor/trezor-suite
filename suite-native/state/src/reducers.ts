import { combineReducers } from '@reduxjs/toolkit';
import { getStoredState } from 'redux-persist';

import { prepareAnalyticsReducer } from '@suite-common/analytics';
import { prepareConnectPopupReducer } from '@suite-common/connect-popup';
import { prepareFirmwareReducer } from '@suite-common/firmware';
import { logsSlice } from '@suite-common/logger';
import {
    messageSystemPersistedWhitelist,
    prepareMessageSystemReducer,
} from '@suite-common/message-system';
import { notificationsReducer } from '@suite-common/toast-notifications';
import { prepareTokenDefinitionsReducer } from '@suite-common/token-definitions';
import {
    feesReducer,
    prepareAccountsReducer,
    prepareBlockchainReducer,
    prepareDeviceReducer,
    prepareDiscoveryReducer,
    prepareFiatRatesReducer,
    prepareStakeReducer,
    prepareTransactionsReducer,
    prepareWalletSettingsReducer,
    walletSettingsPersistedWhitelist,
} from '@suite-common/wallet-core';
// Suite Native has circular in @suite-native/test-utils -> @suite-native/state -> ... -> @suite-native/test-utils
// This is causing problems handling types in WalletConnect, so we import the reducer directly instead of the whole module
import { prepareWalletConnectReducer } from '@suite-common/walletconnect/src/walletConnectReducer';
import { bannerFlagsPersistWhitelist, bannerFlagsReducer } from '@suite-native/banner-flags';
import { deviceAuthorizationReducer } from '@suite-native/device-authorization';
import { discoveryConfigReducer } from '@suite-native/discovery';
import { featureFlagsPersistedKeys, featureFlagsReducer } from '@suite-native/feature-flags';
import { nativeFirmwareReducer } from '@suite-native/firmware';
import { graphPersistTransform, graphReducer } from '@suite-native/graph';
import { sendFormSlice } from '@suite-native/module-send';
import { tradingSlice } from '@suite-native/module-trading';
import { appSettingsPersistWhitelist, appSettingsReducer } from '@suite-native/settings';
import {
    deriveAccountTypeFromPaymentType,
    devicePersistTransform,
    discoveryStopPersistTransform,
    initMmkvStorage,
    migrateAccountBnbToBsc,
    migrateAccountLabel,
    migrateAccountsDeprecateNetworks,
    migrateDeviceState,
    migrateDiscoveryDeprecateNetworks,
    migrateEnabledDiscoveryNetworkSymbols,
    migrateTransactionsBnbToBsc,
    migrateTransactionsDeprecateNetworks,
    preparePersistReducer,
    walletPersistTransform,
    walletStopPersistTransform,
} from '@suite-native/storage';

import { appReducer } from './appSlice';
import { extraDependencies } from './extraDependencies';

const transactionsReducer = prepareTransactionsReducer(extraDependencies);
const accountsReducer = prepareAccountsReducer(extraDependencies);
const fiatRatesReducer = prepareFiatRatesReducer(extraDependencies);
const blockchainReducer = prepareBlockchainReducer(extraDependencies);
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

export const prepareRootReducers = async () => {
    const appSettingsPersistedReducer = await preparePersistReducer({
        reducer: appSettingsReducer,
        persistedKeys: appSettingsPersistWhitelist,
        key: 'appSettings',
        version: 3,
        migrations: {
            2: (oldState: any) => ({ ...oldState, fiatCurrencyCode: oldState.fiatCurrency.label }),
            3: async (oldState: any) => {
                const discoveryConfig = (await getStoredState({
                    key: 'discoveryConfig',
                    storage: await initMmkvStorage(),
                })) as any;
                if (discoveryConfig)
                    return {
                        ...oldState,
                        areTestnetsEnabled: discoveryConfig.areTestnetsEnabled,
                        isCoinEnablingInitFinished: discoveryConfig.isCoinEnablingInitFinished,
                    };

                return oldState;
            },
        },
    });

    const tradingPersistedReducer = await preparePersistReducer({
        reducer: tradingReducer,
        persistedKeys: ['favouriteAssets', 'trades'],
        key: 'trading',
        version: 1,
    });

    const walletSettingsPersistedReducer = await preparePersistReducer({
        reducer: walletSettingsReducer,
        persistedKeys: walletSettingsPersistedWhitelist,
        key: 'walletSettings',
        version: 1,
        initialMigration: async () => {
            const appSettings = (await getStoredState({
                key: 'appSettings',
                storage: await initMmkvStorage(),
            })) as any;
            const discoveryConfig = (await getStoredState({
                key: 'discoveryConfig',
                storage: await initMmkvStorage(),
            })) as any;
            if (appSettings && discoveryConfig)
                return {
                    localCurrency: appSettings.fiatCurrencyCode,
                    enabledNetworks: discoveryConfig.enabledDiscoveryNetworkSymbols,
                    bitcoinAmountUnit: appSettings.bitcoinUnits,
                };
        },
    });

    const walletReducers = combineReducers({
        accounts: accountsReducer,
        blockchain: blockchainReducer,
        fiat: fiatRatesReducer,
        transactions: transactionsReducer,
        discovery: discoveryReducer,
        send: sendFormReducer,
        fees: feesReducer,
        stake: stakeReducer,
        tradingNew: tradingPersistedReducer,
        settings: walletSettingsPersistedReducer,
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
        version: 2,
        transforms: [devicePersistTransform],
        migrations: {
            2: oldState => {
                if (!oldState.devices) return oldState;

                const oldDevicesState: { devices: any } = { devices: oldState.devices };
                const migratedDevices = migrateDeviceState(oldDevicesState.devices);
                const migratedState = { ...oldState, devices: migratedDevices };

                return migratedState;
            },
        },
    });

    const discoveryConfigPersistedReducer = await preparePersistReducer({
        reducer: discoveryConfigReducer,
        persistedKeys: [],
        key: 'discoveryConfig',
        version: 3,
        migrations: {
            2: (oldState: any) => {
                if (!oldState.enabledDiscoveryNetworkSymbols) return oldState;

                const { enabledDiscoveryNetworkSymbols } = oldState;
                const migrateNetworkSymbols = migrateEnabledDiscoveryNetworkSymbols(
                    enabledDiscoveryNetworkSymbols,
                );
                const migratedState = {
                    ...oldState,
                    enabledDiscoveryNetworkSymbols: migrateNetworkSymbols,
                };

                return migratedState;
            },
            3: (oldState: any) => {
                if (!oldState.enabledDiscoveryNetworkSymbols) return oldState;

                const { enabledDiscoveryNetworkSymbols } = oldState;
                const migratedNetworkSymbols = migrateDiscoveryDeprecateNetworks(
                    enabledDiscoveryNetworkSymbols,
                );
                const migratedState = {
                    ...oldState,
                    enabledDiscoveryNetworkSymbols: migratedNetworkSymbols,
                };

                return migratedState;
            },
        },
        transforms: [discoveryStopPersistTransform],
        // kept for backward compatibility, but not persisted anymore
    });

    const featureFlagsPersistedReducer = await preparePersistReducer({
        reducer: featureFlagsReducer,
        persistedKeys: featureFlagsPersistedKeys,
        key: 'featureFlags',
        version: 1,
    });

    const bannerFlagsPersistedReducer = await preparePersistReducer({
        reducer: bannerFlagsReducer,
        persistedKeys: bannerFlagsPersistWhitelist,
        key: 'bannerFlags',
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
            bannerFlags: bannerFlagsPersistedReducer,
            graph: graphReducer,
            device: devicePersistedReducer,
            deviceAuthorization: deviceAuthorizationReducer,
            firmware: firmwareReducer,
            nativeFirmware: nativeFirmwareReducer,
            logs: logsSlice.reducer,
            notifications: notificationsReducer,
            discoveryConfig: discoveryConfigPersistedReducer,
            messageSystem: messageSystemPersistedReducer,
            tokenDefinitions: tokenDefinitionsReducer,
            connectPopup: connectPopupReducer,
            walletConnect: walletConnectReducer,
        } as const),
        // 'wallet' and 'graph' need to be persisted at the top level to ensure device state
        // is accessible for transformation.
        persistedKeys: ['wallet', 'graph'],
        transforms: [walletPersistTransform, graphPersistTransform],
        mergeLevel: 2,
        key: 'root',
        version: 3,
        migrations: {
            2: (oldState: {
                wallet: {
                    accounts: any;
                    transactions: { transactions: any; fetchStatusDetail: any };
                };
            }) => {
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
                            fetchStatusDetail: oldStateWallet.transactions?.fetchStatusDetail,
                        },
                    },
                };

                return migratedState;
            },
            3: (oldState: {
                wallet: {
                    accounts: any;
                    transactions: { transactions: any; fetchStatusDetail: any };
                };
            }) => {
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
                            fetchStatusDetail: oldStateWallet.transactions?.fetchStatusDetail,
                        },
                    },
                };

                return migratedState;
            },
        },
    });

    return rootReducer;
};
