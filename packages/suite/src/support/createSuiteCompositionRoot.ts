import { saveAs } from 'file-saver';

import { type DesktopAnalyticsDep, createAnalytics } from '@suite/analytics';
import { selectShouldRetryFirmwareRevisionCheckError } from '@suite/authenticity-checks';
import { type BluetoothDep, createBluetoothCompositionRoot } from '@suite/bluetooth';
import { type DesktopApiDep } from '@suite/desktop-app-api';
import { rerunFwAuthenticityChecksThunk } from '@suite/device';
import { lockDevice as lockDeviceAction } from '@suite/locks';
import { selectLabelingDataForAccount } from '@suite/metadata';
import {
    type MetadataMigrationDep,
    createMetadataMigrationCompositionRoot,
} from '@suite/metadata-migration';
import {
    type HistoryDep,
    type SuiteRouterHistoryDep,
    createSuiteRouterHistory,
} from '@suite/router';
import { selectDebugSettings, selectLanguage, selectTradeServerEnvironment } from '@suite/settings';
import { createSuiteSyncDesktopCompositionRoot } from '@suite/suite-sync';
import { createBip329CompositionRoot } from '@suite-common/bip329';
import {
    type ConnectInitSettings,
    type CreateTransports,
    type GetTransportsFactoriesDep,
    type TransportsDep,
    createConnectInitCompositionRoot,
} from '@suite-common/connect-init';
import { delegatedIdentityKeyCompositionRoot } from '@suite-common/delegated-identity-key';
import { toGetter } from '@suite-common/dependency-injection';
import { selectDeviceByStaticSessionId } from '@suite-common/device';
import { type CommonServices } from '@suite-common/extra-dependencies';
import { FW_HASH_CHECK_DEFAULT_TIMEOUTS } from '@suite-common/firmware-authenticity';
import { createNetworksCompositionRoot } from '@suite-common/networks';
import { type PlatformEncryptionDep } from '@suite-common/platform-encryption';
import { createMigrateSuiteSyncLabelsForRbfTransactionCompositionRoot } from '@suite-common/suite-rbf-labels-migrations';
import {
    createSuiteSyncWriteLabels,
    selectAllLabelsForAccount,
    selectIsSuiteSyncEnabled,
    selectSuiteSyncWalletLabel,
} from '@suite-common/suite-sync';
import {
    type GetBinFilesBaseUrlDep,
    type LockDevice,
    type ReloadAppDep,
} from '@suite-common/suite-types';
import { type ThpHostNameDep } from '@suite-common/thp';
import { selectTradedAccountKeys } from '@suite-common/trading';
import { selectAccountsByDeviceState } from '@suite-common/wallet-core';
import { type CreateLoggerDep, type GetTrezorConnectPrivilegedDep } from '@trezor/connect';
import { isDesktop } from '@trezor/env-utils';

import { type SuiteReduxStore } from 'src/reducers/createReduxStore';
import { selectIsWindowVisible } from 'src/reducers/suite/windowReducer';
import { type DbDep } from 'src/storage/createDb';
import { reportSecurityCheck } from 'src/utils/suite/sentry';

import { createConnectInitDeviceEventHooks } from './createConnectInitDeviceEventHooks';
import { createConnectInitUiEventHooks } from './createConnectInitUiEventHooks';
import { type AppState } from '../types/suite';

const connectInitSettings: ConnectInitSettings = {
    transportReconnect: true,
    debug: false,
    manifest: {
        email: 'info@trezor.io',
        appName: isDesktop() ? 'Trezor Suite desktop' : 'Trezor Suite web',
        appUrl: isDesktop() ? 'Trezor Suite desktop' : window.origin,
    },
    enableFirmwareHashCheck: true,
    firmwareHashCheckTimeouts: FW_HASH_CHECK_DEFAULT_TIMEOUTS,
};

export type SuiteServices = CommonServices &
    DbDep &
    DesktopApiDep &
    DesktopAnalyticsDep &
    MetadataMigrationDep &
    SuiteRouterHistoryDep &
    TransportsDep &
    BluetoothDep;

export type StoreAPIDep = Pick<SuiteReduxStore, 'getState' | 'dispatch'>;

export type SuiteAppDeps = StoreAPIDep &
    DbDep &
    DesktopApiDep &
    HistoryDep &
    PlatformEncryptionDep &
    CreateLoggerDep &
    GetBinFilesBaseUrlDep &
    ReloadAppDep &
    ThpHostNameDep &
    GetTransportsFactoriesDep &
    GetTrezorConnectPrivilegedDep;

export const selectSuiteServices = (services: any): SuiteServices => services;

export const createSuiteServicesCompositionRoot = (deps: SuiteAppDeps): SuiteServices => {
    const { ensureDelegatedIdentityKey } = delegatedIdentityKeyCompositionRoot({
        dispatch: deps.dispatch,
        getState: deps.getState,
        platformEncryption: deps.platformEncryption,
        getTrezorConnect: deps.getTrezorConnect,
    });

    const analytics = createAnalytics();
    const bluetooth = createBluetoothCompositionRoot({
        dispatch: deps.dispatch,
        getState: deps.getState,
    });

    const getCurrentAccountLabels = toGetter(deps.getState, selectAllLabelsForAccount);
    const getAccountsByDeviceState = toGetter(deps.getState, selectAccountsByDeviceState);

    // Label writers that take storage as a param, used by the migration. They never call
    // `ensureWalletSuiteSyncOn`, so the migration listener can be built before suiteSync.
    const writeLabels = createSuiteSyncWriteLabels({ getState: deps.getState, analytics });

    const { migrateLabelsIfAvailable, migrateLegacyLabelsToSuiteSync } =
        createMetadataMigrationCompositionRoot({
            dispatch: deps.dispatch,
            getState: deps.getState,
            getAccountsByDeviceState,
            getCurrentWalletLabel: toGetter(deps.getState, selectSuiteSyncWalletLabel),
            getCurrentAccountLabels,
            getDeviceByStaticSessionId: toGetter(deps.getState, selectDeviceByStaticSessionId),
            ...writeLabels,
        });

    const suiteSync = createSuiteSyncDesktopCompositionRoot({
        dispatch: deps.dispatch,
        getState: deps.getState,
        platformEncryption: deps.platformEncryption,
        getTrezorConnect: deps.getTrezorConnect,
        ensureDelegatedIdentityKey,
        analytics,
        fetch: globalThis.fetch.bind(globalThis),
        onStorageEnsured: migrateLabelsIfAvailable,
    });

    const { bip329 } = createBip329CompositionRoot({
        getIsSuiteSyncEnabled: toGetter(deps.getState, selectIsSuiteSyncEnabled),
        getLegacyAccountLabels: toGetter(deps.getState, selectLabelingDataForAccount),
        getAllLabelsForAccount: getCurrentAccountLabels,
        updateAddressLabel: suiteSync.labeling.updateAddressLabel,
        updateOutputLabel: suiteSync.labeling.updateOutputLabel,
    });

    const networks = createNetworksCompositionRoot({
        getTrezorConnect: deps.getTrezorConnect,
        dispatch: deps.dispatch,
    });

    const createTransports: CreateTransports = transports => {
        const factories = deps.getTransportsFactories();

        return transports.map(name => {
            const factory = factories[name];
            if (!factory) {
                throw new Error(`Transport factory for ${name} not found`);
            }

            return factory(deps.createLogger);
        }) as ReturnType<CreateTransports>;
    };

    const lockDevice: LockDevice = isLocked => {
        deps.dispatch(lockDeviceAction(isLocked));
    };
    const getAllowPrerelease = toGetter(
        deps.getState,
        (state: AppState) => state.desktopUpdate?.allowPrerelease ?? false,
    );

    const { connectInit } = createConnectInitCompositionRoot({
        dispatch: deps.dispatch,
        getState: deps.getState,
        lockDevice,
        analytics,
        connectInitDeviceEventHooks: createConnectInitDeviceEventHooks({
            dispatch: deps.dispatch,
        }),
        connectInitSettings,
        createLogger: deps.createLogger,
        createTransports,
        getAllowPrerelease,
        getBinFilesBaseUrl: deps.getBinFilesBaseUrl,
        getDebugSettings: toGetter(deps.getState, selectDebugSettings),
        getThpSettings: toGetter(deps.getState, (state: AppState) => ({
            appName: 'Trezor Suite', // NOTE: this is displayed on Trezor. not the same as manifest.appName
            pairingMethods: ['CodeEntry'],
            knownCredentials: state.thp?.credentials,
        })),
        thpHostName: deps.thpHostName,
    });

    return {
        db: deps.db,
        desktopApi: deps.desktopApi,
        networks,
        suiteSync,
        bip329,
        migrateLegacyLabelsToSuiteSync,
        ensureDelegatedIdentityKey,
        platformEncryption: deps.platformEncryption,
        analytics,
        bluetooth,
        suiteRouterHistory: createSuiteRouterHistory({
            history: deps.history,
        }),
        reportSecurityCheck,
        reloadApp: deps.reloadApp,
        saveAs: (data: Blob, fileName: string) => saveAs(data, fileName),
        connectInit,
        connectInitUiEventHooks: createConnectInitUiEventHooks({
            dispatch: deps.dispatch,
            getState: deps.getState,
        }),
        createTransports,
        getTokenDefinitionsEnabledNetworks: toGetter(
            deps.getState,
            (state: AppState) => state.wallet.settings.enabledNetworks,
        ),
        getBinFilesBaseUrl: deps.getBinFilesBaseUrl,
        getLanguage: toGetter(deps.getState, selectLanguage),
        getSelectedAccount: toGetter(
            deps.getState,
            (state: AppState) => state.wallet.selectedAccount,
        ),
        getIsWindowVisible: toGetter(deps.getState, selectIsWindowVisible),
        getTradingEnvironment: toGetter(deps.getState, selectTradeServerEnvironment),
        getTradedAccountKeys: toGetter(deps.getState, selectTradedAccountKeys),
        getAllowPrerelease,
        shouldRetryFirmwareRevisionCheckError: toGetter(
            deps.getState,
            selectShouldRetryFirmwareRevisionCheckError,
        ),
        rerunFwAuthenticityChecksCall: () => {
            deps.dispatch(rerunFwAuthenticityChecksThunk());
        },
        lockDevice,
        migrateSuiteSyncLabelsForRbfTransaction:
            createMigrateSuiteSyncLabelsForRbfTransactionCompositionRoot({
                dispatch: deps.dispatch,
                getState: deps.getState,
                updateOutputLabel: suiteSync.labeling.updateOutputLabel,
            }),
    };
};
