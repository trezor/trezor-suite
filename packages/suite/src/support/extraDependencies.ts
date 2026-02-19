import { PayloadAction } from '@reduxjs/toolkit';
import { saveAs } from 'file-saver';

import { DesktopAnalyticsDep, createAnalytics } from '@suite/analytics';
import { metadataActions, metadataLabelingActions } from '@suite/metadata';
import { closeModal, openModal } from '@suite/modal';
import { createElectronPlatformEncryption } from '@suite/platform-encryption-electron';
import { createWebauthnPlatformEncryption } from '@suite/platform-encryption-webauthn';
import {
    ensureRouterPath,
    getPrefixedURL,
    selectRoute,
    selectRouterApp,
    stripPrefixedURL,
} from '@suite/router';
import {
    DisableLegacyMetadataIfNeededDep,
    createSuiteSyncDesktopCompositionRoot,
} from '@suite/suite-sync';
import { delegatedIdentityKeyCompositionRoot } from '@suite-common/delegated-identity-key';
import type { DeviceReducerState } from '@suite-common/device';
import { FW_HASH_CHECK_DEFAULT_TIMEOUTS } from '@suite-common/firmware-authenticity';
import {
    CommonServices,
    ConnectInitSettings,
    ExtraDependenciesStatic,
} from '@suite-common/redux-utils';
import { createMigrateSuiteSyncLabelsForRbfTransactionCompositionRoot } from '@suite-common/suite-rbf-labels-migrations';
import { SuiteSyncAppReloaderDep } from '@suite-common/suite-sync-types';
import {
    TokenDefinitionsState,
    buildTokenDefinitionsFromStorage,
} from '@suite-common/token-definitions';
import { isNetworkSymbol } from '@suite-common/wallet-config';
import {
    BlockchainState,
    ExplorerConfig,
    FiatRatesState,
    SendState,
    TransactionsState,
    WalletSettingsState,
} from '@suite-common/wallet-core';
import { createAccountKey } from '@suite-common/wallet-types';
import { buildHistoricRatesFromStorage } from '@suite-common/wallet-utils';
import TrezorConnect, { StaticSessionId } from '@trezor/connect';
import { isDesktop } from '@trezor/env-utils';
import { desktopApi } from '@trezor/suite-desktop-api';

import { StorageLoadAction } from 'src/actions/suite/storageActions';
import * as cardanoStakingActions from 'src/actions/wallet/cardanoStakingActions';
import { selectIsWindowVisible } from 'src/reducers/suite/windowReducer';
import { reportSecurityCheck } from 'src/utils/suite/sentry';
import { fixLoadedCoinjoinAccount } from 'src/utils/wallet/coinjoinUtils';

import {
    HistoryDep,
    SuiteRouterHistory,
    SuiteRouterHistoryDep,
    SuiteRouterHistoryDeps,
} from './suite/suiteRouterHistory';
import { forgetBluetoothDeviceThunk } from '../actions/bluetooth/bluetoothEraseBondsThunk';
import * as suiteActions from '../actions/suite/suiteActions';
import { createDisableLegacyMetadataIfNeeded } from '../actions/suiteSync/disableLegacyMetadateIfNeeded';
import type { BioAuthState } from '../reducers/bioAuth';
import { AppState, TrezorDevice } from '../types/suite';

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

export const createSuiteRouterHistory = ({
    history,
}: SuiteRouterHistoryDeps): SuiteRouterHistory => ({
    getLocation: () => {
        const { location } = history;

        return ensureRouterPath({ ...location, pathname: stripPrefixedURL(location.pathname) });
    },
    navigate: (to, state) =>
        history.push(
            { ...to, pathname: to.pathname ? getPrefixedURL(to.pathname) : undefined },
            state,
        ),
    listen: listener =>
        history.listen(({ location, action }) =>
            listener({ location: ensureRouterPath(location), action }),
        ),
});

export type StoreAPIDep = {
    getState: () => any;
    dispatch: (_: any) => any;
};

export type SuiteAppDeps = StoreAPIDep & HistoryDep & SuiteSyncAppReloaderDep;

export type SuiteServices = CommonServices &
    DesktopAnalyticsDep &
    DisableLegacyMetadataIfNeededDep &
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

    /** @deprecated Compatibility for Legacy Labeling */
    const disableLegacyMetadataIfNeeded = createDisableLegacyMetadataIfNeeded({
        dispatch: deps.dispatch,
        getState: deps.getState,
    });

    const analytics = createAnalytics();

    const suiteSync = createSuiteSyncDesktopCompositionRoot({
        dispatch: deps.dispatch,
        getState: deps.getState,
        reloadApp: deps.reloadApp,
        platformEncryption,
        trezorConnect: TrezorConnect,
        ensureDelegatedIdentityKey,
        disableLegacyMetadataIfNeeded,
        analytics,
    });

    return {
        suiteSync,
        ensureDelegatedIdentityKey,
        platformEncryption,
        analytics,
        disableLegacyMetadataIfNeeded,
        suiteRouterHistory: createSuiteRouterHistory({
            history: deps.history,
        }),
        reportSecurityCheck,
        saveAs: (data, fileName) => saveAs(data, fileName),
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
        cardanoValidatePendingTxOnBlock: cardanoStakingActions.validatePendingTxOnBlock,
        initMetadata: metadataLabelingActions.init,
        fetchAndSaveMetadata: metadataLabelingActions.fetchAndSaveMetadata,
        addAccountMetadata: metadataLabelingActions.addAccountMetadata,
        forgetBluetoothDevice: forgetBluetoothDeviceThunk,
    },
    selectors: {
        selectTokenDefinitionsEnabledNetworks: (state: AppState) =>
            state.wallet.settings.enabledNetworks,
        selectDebugSettings: (state: AppState) => state.suite.settings.debug,
        // FW binaries on desktop are stored in "*/static/connect/data/firmware/*/*.bin" (see "connect-common" package)
        selectDesktopBinDir: (state: AppState) => state.desktop?.paths?.binDir,
        selectDevice: (state: AppState) => state.device.selectedDevice,
        selectLanguage: (state: AppState) => state.suite.settings.language,
        selectMetadata: (state: AppState) => state.metadata,
        selectRouterApp,
        selectRoute,
        selectAddressDisplayType: (state: AppState) => state.suite.settings.addressDisplayType,
        selectSelectedAccount: (state: AppState) => state.wallet.selectedAccount,
        selectSelectedAccountStatus: (state: AppState) => state.wallet.selectedAccount.status,
        selectIsWindowVisible,
        selectTradingEnvironment: (state: AppState) =>
            state.suite.settings.debug.invityServerEnvironment,
        selectIsViewOnlyByDefaultEnabled: (_: AppState) => true,
        selectIsSuiteSyncEnabled: (state: AppState) => state.suiteSync.settings.isSuiteSyncEnabled,
        selectThpSettings: (state: AppState) => ({
            appName: 'Trezor Suite', // NOTE: this is displayed on Trezor. not the same as manifest.appName
            pairingMethods: ['CodeEntry'],
            knownCredentials: state.thp?.credentials,
        }),
        selectAllowPrerelease: (state: AppState) => state.desktopUpdate?.allowPrerelease ?? false,
    },
    actions: {
        setAccountAddMetadata: metadataActions.setAccountAdd,
        lockDevice: suiteActions.lockDevice,
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
    },
};

// NOTE: We need to typecast the common services in extra argument in thunks to this proper type
// extra.services do contain all the needed services, but in order to make the typing work properly,
// we'd need to define dispatch() for each platform separately
export const asSuiteServices = (services: CommonServices): SuiteServices =>
    services as SuiteServices;
