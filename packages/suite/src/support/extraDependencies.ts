import { type PayloadAction } from '@reduxjs/toolkit';
import { saveAs } from 'file-saver';

import { type DesktopAnalyticsDep, createAnalytics } from '@suite/analytics';
import type { FlagsState } from '@suite/flags';
import { lockDevice } from '@suite/locks';
import {
    metadataActions,
    metadataLabelingActions,
    selectLabelingDataForAccount,
    selectLabelingDataForWallet,
} from '@suite/metadata';
import {
    type MetadataMigrationDep,
    createMetadataMigrationCompositionRoot,
} from '@suite/metadata-migration';
import { closeModal, openModal } from '@suite/modal';
import { createElectronPlatformEncryption } from '@suite/platform-encryption-electron';
import { createWebauthnPlatformEncryption } from '@suite/platform-encryption-webauthn';
import {
    type HistoryDep,
    type SuiteRouterHistoryDep,
    asSuiteRouterHistoryService,
    createSuiteRouterHistory,
} from '@suite/router';
import {
    type SuiteSettingsState,
    selectAddressDisplayType,
    selectDebugSettings,
    selectInvityServerEnvironment,
    selectLanguage,
} from '@suite/settings';
import { createSuiteSyncDesktopCompositionRoot } from '@suite/suite-sync';
import { createBip329CompositionRoot } from '@suite-common/bip329';
import { delegatedIdentityKeyCompositionRoot } from '@suite-common/delegated-identity-key';
import { toGetter } from '@suite-common/dependency-injection';
import { type DeviceReducerState } from '@suite-common/device';
import { FW_HASH_CHECK_DEFAULT_TIMEOUTS } from '@suite-common/firmware-authenticity';
import {
    type CommonServices,
    type ConnectInitSettings,
    type ExtraDependenciesStatic,
} from '@suite-common/redux-utils';
import { createMigrateSuiteSyncLabelsForRbfTransactionCompositionRoot } from '@suite-common/suite-rbf-labels-migrations';
import {
    selectAllLabelsForAccount,
    selectIsSuiteSyncEnabled,
    selectSuiteSyncWalletLabel,
} from '@suite-common/suite-sync';
import {
    type TokenDefinitionsState,
    buildTokenDefinitionsFromStorage,
} from '@suite-common/token-definitions';
import { isNetworkSymbol } from '@suite-common/wallet-config';
import {
    type BlockchainState,
    type ExplorerConfig,
    type FiatRatesState,
    type PhishingState,
    type SendState,
    type TransactionsState,
    type WalletSettingsState,
    selectAccountsByDeviceState,
} from '@suite-common/wallet-core';
import { createAccountKey } from '@suite-common/wallet-types';
import { buildHistoricRatesFromStorage } from '@suite-common/wallet-utils';
import TrezorConnect, { type StaticSessionId } from '@trezor/connect';
import { isDesktop } from '@trezor/env-utils';
import { desktopApi } from '@trezor/suite-desktop-api';

import { type StorageLoadAction } from 'src/actions/suite/storageActions';
import { selectIsWindowVisible } from 'src/reducers/suite/windowReducer';
import { reportSecurityCheck } from 'src/utils/suite/sentry';
import { fixLoadedCoinjoinAccount } from 'src/utils/wallet/coinjoinUtils';

import { forgetBluetoothDeviceThunk } from '../actions/bluetooth/bluetoothEraseBondsThunk';
import type { BioAuthState } from '../reducers/bioAuth';
import { type AppState, type TrezorDevice } from '../types/suite';

const connectInitSettings: ConnectInitSettings = {
    transportReconnect: true,
    debug: false,
    manifest: {
        email: 'info@trezor.io',
        appName: isDesktop() ? 'Trezor Suite desktop' : 'Trezor Suite web',
        appUrl: isDesktop() ? 'Trezor Suite desktop' : window.origin,
    },
    sharedLogger: false,
    enableFirmwareHashCheck: true,
    firmwareHashCheckTimeouts: FW_HASH_CHECK_DEFAULT_TIMEOUTS,
};

export type StoreAPIDep = {
    getState: () => any;
    dispatch: (_: any) => any;
};

export type SuiteAppDeps = StoreAPIDep & HistoryDep;

export type SuiteServices = CommonServices &
    DesktopAnalyticsDep &
    MetadataMigrationDep &
    SuiteRouterHistoryDep;

export const createSuiteServicesCompositionRoot = (deps: SuiteAppDeps): SuiteServices => {
    const platformEncryption = isDesktop()
        ? createElectronPlatformEncryption({ desktopApi })
        : createWebauthnPlatformEncryption();

    const { ensureDelegatedIdentityKey } = delegatedIdentityKeyCompositionRoot({
        dispatch: deps.dispatch,
        getState: deps.getState,
        platformEncryption,
        trezorConnect: TrezorConnect,
    });

    const analytics = createAnalytics();

    const suiteSync = createSuiteSyncDesktopCompositionRoot({
        dispatch: deps.dispatch,
        getState: deps.getState,
        platformEncryption,
        trezorConnect: TrezorConnect,
        ensureDelegatedIdentityKey,
        analytics,
    });

    const { bip329 } = createBip329CompositionRoot({
        getIsSuiteSyncEnabled: toGetter(deps.getState, selectIsSuiteSyncEnabled),
        getLegacyAccountLabels: toGetter(deps.getState, selectLabelingDataForAccount),
        getAllLabelsForAccount: toGetter(deps.getState, selectAllLabelsForAccount),
        updateAddressLabel: suiteSync.labeling.updateAddressLabel,
        updateOutputLabel: suiteSync.labeling.updateOutputLabel,
    });

    const { migrateLegacyLabelsToSuiteSync } = createMetadataMigrationCompositionRoot({
        getAccountsByDeviceState: toGetter(deps.getState, selectAccountsByDeviceState),
        getLegacyWalletLabels: toGetter(deps.getState, selectLabelingDataForWallet),
        getLegacyAccountLabels: toGetter(deps.getState, selectLabelingDataForAccount),
        getCurrentWalletLabel: toGetter(deps.getState, selectSuiteSyncWalletLabel),
        getCurrentAccountLabels: toGetter(deps.getState, selectAllLabelsForAccount),
        updateWalletLabel: suiteSync.labeling.updateWalletLabel,
        updateAccountLabel: suiteSync.labeling.updateAccountLabel,
        updateAddressLabel: suiteSync.labeling.updateAddressLabel,
        updateOutputLabel: suiteSync.labeling.updateOutputLabel,
    });

    return {
        suiteSync,
        bip329,
        migrateLegacyLabelsToSuiteSync,
        ensureDelegatedIdentityKey,
        platformEncryption,
        analytics,
        suiteRouterHistory: createSuiteRouterHistory({
            history: deps.history,
        }),
        reportSecurityCheck,
        saveAs: (data: Blob, fileName: string) => saveAs(data, fileName),
        connectInitSettings,
        migrateSuiteSyncLabelsForRbfTransaction:
            createMigrateSuiteSyncLabelsForRbfTransactionCompositionRoot({
                dispatch: deps.dispatch,
                getState: deps.getState,
                updateOutputLabel: suiteSync.labeling.updateOutputLabel,
            }),
    };
};

export const extraDependencies: ExtraDependenciesStatic = {
    thunks: {
        initMetadata: metadataLabelingActions.init,
        fetchAndSaveMetadata: metadataLabelingActions.fetchAndSaveMetadata,
        addAccountMetadata: metadataLabelingActions.addAccountMetadata,
        forgetBluetoothDevice: forgetBluetoothDeviceThunk,
    },
    selectors: {
        selectTokenDefinitionsEnabledNetworks: (state: AppState) =>
            state.wallet.settings.enabledNetworks,
        selectDebugSettings,
        // FW binaries on desktop are stored in "*/static/connect/data/firmware/*/*.bin" (see "connect-common" package)
        selectDesktopBinDir: (state: AppState) => state.desktop?.paths?.binDir,
        selectLanguage,
        selectAddressDisplayType,
        selectSelectedAccount: (state: AppState) => state.wallet.selectedAccount,
        selectSelectedAccountStatus: (state: AppState) => state.wallet.selectedAccount.status,
        selectIsWindowVisible,
        selectTradingEnvironment: selectInvityServerEnvironment,
        selectIsViewOnlyByDefaultEnabled: (_: AppState) => true,
        selectThpSettings: (state: AppState) => ({
            appName: 'Trezor Suite', // NOTE: this is displayed on Trezor. not the same as manifest.appName
            pairingMethods: ['CodeEntry'],
            knownCredentials: state.thp?.credentials,
        }),
        selectAllowPrerelease: (state: AppState) => state.desktopUpdate?.allowPrerelease ?? false,
    },
    actions: {
        setAccountAddMetadata: metadataActions.setAccountAdd,
        lockDevice,
        onModalCancel: closeModal,
        openModal,
    },
    actionTypes: {
        storageLoad: '@storage/load',
        setDeviceMetadata: '@metadata/set-device-metadata',
        setDeviceMetadataPasswords: '@metadata/set-device-metadata-passwords',
    },
    reducers: {
        storageLoadBlockchain: (state: BlockchainState, { payload }: StorageLoadAction) => {
            payload.backendSettings.forEach(backend => {
                const blockchain = state[backend.key];
                if (blockchain) {
                    blockchain.backends = backend.value;
                }
            });
        },
        storageLoadExplorer: (state: ExplorerConfig, { payload }: StorageLoadAction) => {
            payload.explorer.forEach(({ symbol, explorer }) => {
                state[symbol] = {
                    ...state[symbol],
                    custom: explorer,
                };
            });
        },
        storageLoadTransactions: (state: TransactionsState, { payload }: StorageLoadAction) => {
            const { txs, phishing } = payload;

            txs.forEach(item => {
                const k = createAccountKey({
                    accountDescriptor: item.tx.descriptor,
                    networkSymbol: item.tx.symbol,
                    deviceStaticSessionId: item.tx.deviceState,
                });
                if (!state.transactions[k]) {
                    state.transactions[k] = [];
                }
                state.transactions[k][item.order] = item.tx;
            });

            phishing.forEach(({ key, value }) => {
                state.phishing[key] = value;
            });
        },
        storageLoadPhishingMetadata: (state: PhishingState, { payload }: StorageLoadAction) => {
            if (payload.phishingMetadata) {
                return { ...state, ...payload.phishingMetadata };
            }

            return state;
        },
        storageLoadHistoricRates: (state: FiatRatesState, { payload }: StorageLoadAction) => {
            if (payload.historicRates) {
                const fiatRates = payload.historicRates.map(rate => rate.value);
                const historicRates = buildHistoricRatesFromStorage(fiatRates);
                state.historic = historicRates;
            }
        },
        storageLoadTokenManagement: (
            state: TokenDefinitionsState,
            { payload }: StorageLoadAction,
        ) => {
            if (payload.tokenManagement) {
                const tokenDefinitions = buildTokenDefinitionsFromStorage(payload.tokenManagement);
                Object.keys(tokenDefinitions).forEach(symbol => {
                    if (isNetworkSymbol(symbol)) {
                        state[symbol] = tokenDefinitions[symbol];
                    }
                });
            }
        },
        storageLoadAccounts: (_, { payload }: StorageLoadAction) =>
            payload.accounts.map(acc =>
                acc.backendType === 'coinjoin' ? fixLoadedCoinjoinAccount(acc) : acc,
            ),
        setDeviceMetadataReducer: (
            state: DeviceReducerState,
            {
                payload,
            }: PayloadAction<{ deviceState: StaticSessionId; metadata: TrezorDevice['metadata'] }>,
        ) => {
            const { deviceState, metadata } = payload;
            const index = state.devices.findIndex(
                (d: TrezorDevice) => d.state?.staticSessionId === deviceState,
            );
            const device = state.devices[index];
            if (!device) return;
            device.metadata = metadata;
        },
        setDeviceMetadataPasswordsReducer: (
            state: DeviceReducerState,
            {
                payload,
            }: PayloadAction<{
                deviceState: StaticSessionId;
                metadata: TrezorDevice['passwords'];
            }>,
        ) => {
            const { deviceState, metadata } = payload;
            const index = state.devices.findIndex(
                (d: TrezorDevice) => d.state?.staticSessionId === deviceState,
            );
            const device = state.devices[index];
            if (!device) return;
            device.passwords = metadata;
        },
        storageLoadDevices: (state: DeviceReducerState, { payload }: StorageLoadAction) => {
            // @ts-expect-error loaded devices have empty path, TODO deviceReducer should have path nullable, because remembered wallets??
            state.devices = payload.devices.map(device => {
                const persistentDeviceData = payload.persistentDeviceData?.find(
                    ({ device_id }) => device_id === device.id,
                );
                if (persistentDeviceData) {
                    return {
                        ...device,
                        thp: persistentDeviceData.thp,
                    };
                } else {
                    return device;
                }
            });

            state.persistentDeviceData = payload.persistentDeviceData ?? [];
        },
        storageLoadFormDrafts: (state: SendState, { payload }: StorageLoadAction) => {
            payload.sendFormDrafts.forEach(d => {
                state.drafts[d.key] = d.value;
            });
        },
        storageLoadWalletSettings: (state: WalletSettingsState, { payload }: StorageLoadAction) =>
            payload.walletSettings ? { ...state, ...payload.walletSettings } : state,
        // this is deprecated, bioAuth settings is now stored in electron store
        storageLoadBioAuth: (state: BioAuthState, { payload }: StorageLoadAction) => {
            if (!payload?.bioAuth) return state;

            // Only load the bioAuthEnabled property, ignore all other properties
            if (payload.bioAuth.bioAuthEnabled !== undefined) {
                return {
                    ...state,
                    bioAuthEnabled: payload.bioAuth.bioAuthEnabled,
                };
            }

            return state;
        },
        storageLoadFlags: (state: FlagsState, { payload }: StorageLoadAction) =>
            payload.suiteSettings?.flags ? { ...state, ...payload.suiteSettings.flags } : state,
        storageLoadSuiteSettings: (state: SuiteSettingsState, { payload }: StorageLoadAction) => {
            if (!payload.suiteSettings?.settings) return state;

            return {
                ...state,
                ...payload.suiteSettings.settings,
                enabledSecurityChecks: {
                    ...state.enabledSecurityChecks,
                    ...payload.suiteSettings.settings.enabledSecurityChecks,
                },
            };
        },
    },
};

// NOTE: We need to typecast the common services in extra argument in thunks to this proper type
// extra.services do contain all the needed services, but in order to make the typing work properly,
// we'd need to define dispatch() for each platform separately
export const asSuiteServices = (services: CommonServices): SuiteServices =>
    asSuiteRouterHistoryService(services) as SuiteServices;
