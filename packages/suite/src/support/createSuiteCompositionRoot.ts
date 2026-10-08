import { saveAs } from 'file-saver';

import { type DesktopAnalyticsDep, createAnalytics } from '@suite/analytics';
import { selectShouldRetryFirmwareRevisionCheckError } from '@suite/authenticity-checks';
import { type BluetoothDep, createBluetoothCompositionRoot } from '@suite/bluetooth';
import { type DesktopApiDep } from '@suite/desktop-app-api';
import { rerunFwAuthenticityChecksThunk } from '@suite/device';
import { selectIsQueryChainDataEnabled } from '@suite/flags';
import { lockDevice } from '@suite/locks';
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
    type ChainNetworksStoreDep,
    createChainNetworksStore,
    createReadChainPendingSends,
} from '@suite-common/chain-data';
import {
    type ConnectInitSettings,
    type CreateTransports,
    type GetTransportsFactoriesDep,
    type TransportsDep,
} from '@suite-common/connect-init';
import { delegatedIdentityKeyCompositionRoot } from '@suite-common/delegated-identity-key';
import { toGetter } from '@suite-common/dependency-injection';
import { selectDeviceByStaticSessionId } from '@suite-common/device';
import { type CommonServices } from '@suite-common/extra-dependencies';
import {
    createFetchBlockbookHttpCurrentRate,
    createFetchBlockbookHttpHistoricRates,
    createFetchCoinGeckoCurrentRate,
    createFetchCoinGeckoHistoricRates,
} from '@suite-common/fiat-services';
import { FW_HASH_CHECK_DEFAULT_TIMEOUTS } from '@suite-common/firmware-authenticity';
import { createNetworksCompositionRoot } from '@suite-common/networks';
import { type PlatformEncryptionDep } from '@suite-common/platform-encryption';
import { type QueryClientDep, createQueryClient } from '@suite-common/react-query';
import { createMigrateSuiteSyncLabelsForRbfTransactionCompositionRoot } from '@suite-common/suite-rbf-labels-migrations';
import {
    createSuiteSyncWriteLabels,
    selectAllLabelsForAccount,
    selectIsSuiteSyncEnabled,
    selectSuiteSyncWalletLabel,
} from '@suite-common/suite-sync';
import { type GetBinFilesBaseUrlDep, type ReloadAppDep } from '@suite-common/suite-types';
import { type ThpHostNameDep } from '@suite-common/thp';
import { notificationsActions } from '@suite-common/toast-notifications';
import { selectTradedAccountKeys } from '@suite-common/trading';
import {
    createWalletChainSendDeps,
    selectAccountsByDeviceState,
    selectChainNetworkSelection,
} from '@suite-common/wallet-core';
import { type GetTrezorConnectPrivilegedDep } from '@trezor/connect';
import { isDesktop } from '@trezor/env-utils';
import type { CreateLoggerDep } from '@trezor/logger';
import {
    type RuntimeEvmNetworkRegistryDep,
    type RuntimeEvmNetworkRegistrySnapshot,
    createEvmJsonRpcChainNetwork,
    createRuntimeEvmNetworkRegistry,
    createViemEvmJsonRpcClient,
} from '@trezor/network-ethereum-suite-common';

import { type SuiteReduxStore } from 'src/reducers/createReduxStore';
import { selectIsWindowVisible } from 'src/reducers/suite/windowReducer';
import { type DbDep } from 'src/storage/createDb';
import { reportSecurityCheck } from 'src/utils/suite/sentry';

import { createChainNodeFetch } from './chainNetworks/createChainNodeFetch';
import { createDesktopChainNetworks } from './chainNetworks/createDesktopChainNetworks';
import { createConnectInitDeviceEventHooks } from './createConnectInitDeviceEventHooks';
import { createConnectInitUIEventHooks } from './createConnectInitUIEventHooks';
import { createReduxSource } from './createReduxSource';
import {
    BUILT_IN_NETWORK_RESERVATIONS,
    selectTrezorListedRuntimeEvmNetworks,
} from './runtimeEvmNetworks/runtimeEvmNetworkSources';
import { createIdbRuntimeNetworkPreferencesStore } from './runtimeNetworks/createIdbRuntimeNetworkPreferencesStore';
import { type AppState } from '../types/suite';

const connectInitSettings: ConnectInitSettings = {
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
    BluetoothDep &
    ChainNetworksStoreDep &
    RuntimeEvmNetworkRegistryDep &
    QueryClientDep;

export type StoreAPIDep = Pick<SuiteReduxStore, 'getState' | 'dispatch' | 'subscribe'>;

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

    // Runtime EVM networks: Trezor's signed list and the user's preferences, which this platform
    // keeps in its own IndexedDB store, outside Redux.
    const runtimeNetworksLogger = deps.createLogger?.('runtime-networks');
    const reduxStore = { getState: deps.getState, subscribe: deps.subscribe };
    const runtimeEvmNetworkRegistry = createRuntimeEvmNetworkRegistry({
        preferences: createIdbRuntimeNetworkPreferencesStore({
            db: deps.db,
            onStorageError: error =>
                runtimeNetworksLogger?.warn(
                    'Runtime network preferences storage failed:',
                    error instanceof Error ? error.name : 'unknown error',
                ),
        }),
        trezorListed: createReduxSource({
            ...reduxStore,
            select: selectTrezorListedRuntimeEvmNetworks,
        }),
        isActive: createReduxSource({ ...reduxStore, select: selectIsQueryChainDataEnabled }),
        builtIn: BUILT_IN_NETWORK_RESERVATIONS,
    });

    const queryClient = createQueryClient('web');
    // EVM networks read the account's pending sends from the cache to resolve their nonce.
    const getChainPendingSends = createReadChainPendingSends({ queryClient });

    const createChainNetworks = createDesktopChainNetworks({
        ...createWalletChainSendDeps({ dispatch: deps.dispatch, getState: deps.getState }),
        getChainPendingSends,
        getTrezorConnect: deps.getTrezorConnect,
        getNetworkConfig: networks.getNetworkConfig,
        fetchCoinGeckoCurrentRate: createFetchCoinGeckoCurrentRate(),
        fetchBlockbookHttpCurrentRate: createFetchBlockbookHttpCurrentRate(),
        fetchCoinGeckoHistoricRates: createFetchCoinGeckoHistoricRates(),
        fetchBlockbookHttpHistoricRates: createFetchBlockbookHttpHistoricRates(),
        createRuntimeEvmChainNetwork: createEvmJsonRpcChainNetwork({
            getTrezorConnect: deps.getTrezorConnect,
            getChainPendingSends,
            // The app's fetch follows its proxy settings (Tor) to the network's own nodes.
            createRpcClient: createViemEvmJsonRpcClient({
                fetch: createChainNodeFetch({
                    fetch: globalThis.fetch.bind(globalThis),
                    allowHost: async hostname =>
                        !deps.desktopApi.available ||
                        (await deps.desktopApi.allowChainNodeHost(hostname)).success,
                }),
            }),
            // Not reported: the error comes from a node the app does not run.
            onEvmFeeEstimationFailed: () => {
                deps.dispatch(notificationsActions.addToast({ type: 'estimated-fee-error' }));
            },
        }),
    });

    // Built once a source changed: the selection (still kept in Redux settings) or the runtime
    // networks. Unchanged inputs return the same networks, so the store publishes nothing.
    let built:
        | {
              selection: ReturnType<typeof selectChainNetworkSelection>;
              runtime: RuntimeEvmNetworkRegistrySnapshot['enabledDefinitions'];
              networks: ReturnType<typeof createChainNetworks>;
          }
        | undefined;
    const chainNetworksStore = createChainNetworksStore({
        subscribeToSources: onChange => {
            const unsubscribes = [
                deps.subscribe(onChange),
                runtimeEvmNetworkRegistry.subscribe(onChange),
            ];

            return () => unsubscribes.forEach(unsubscribe => unsubscribe());
        },
        getNetworks: () => {
            const selection = selectChainNetworkSelection(deps.getState());
            const runtime = runtimeEvmNetworkRegistry.getSnapshot().enabledDefinitions;
            if (built?.selection !== selection || built.runtime !== runtime) {
                built = { selection, runtime, networks: createChainNetworks(selection, runtime) };
            }

            return built.networks;
        },
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

    return {
        db: deps.db,
        desktopApi: deps.desktopApi,
        networks,
        chainNetworksStore,
        runtimeEvmNetworkRegistry,
        queryClient,
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
        connectInitSettings,
        connectInitDeviceEventHooks: createConnectInitDeviceEventHooks({
            dispatch: deps.dispatch,
        }),
        connectInitUIEventHooks: createConnectInitUIEventHooks({
            dispatch: deps.dispatch,
            getState: deps.getState,
        }),
        createLogger: deps.createLogger,
        thpHostName: deps.thpHostName,
        createTransports,
        getTokenDefinitionsEnabledNetworks: toGetter(
            deps.getState,
            (state: AppState) => state.wallet.settings.enabledNetworks,
        ),
        // TODO: Coinjoin has not been moved to @suite-common yet, so its debug settings type is not available here.
        getDebugSettings: toGetter(deps.getState, selectDebugSettings),
        getBinFilesBaseUrl: deps.getBinFilesBaseUrl,
        getLanguage: toGetter(deps.getState, selectLanguage),
        getSelectedAccount: toGetter(
            deps.getState,
            (state: AppState) => state.wallet.selectedAccount,
        ),
        getIsWindowVisible: toGetter(deps.getState, selectIsWindowVisible),
        getTradingEnvironment: toGetter(deps.getState, selectTradeServerEnvironment),
        getTradedAccountKeys: toGetter(deps.getState, selectTradedAccountKeys),
        getThpSettings: toGetter(deps.getState, (state: AppState) => ({
            appName: 'Trezor Suite', // NOTE: this is displayed on Trezor. not the same as manifest.appName
            pairingMethods: ['CodeEntry'],
            knownCredentials: state.thp?.credentials,
        })),
        getAllowPrerelease: toGetter(
            deps.getState,
            (state: AppState) => state.desktopUpdate?.allowPrerelease ?? false,
        ),
        shouldRetryFirmwareRevisionCheckError: toGetter(
            deps.getState,
            selectShouldRetryFirmwareRevisionCheckError,
        ),
        rerunFwAuthenticityChecksCall: () => {
            deps.dispatch(rerunFwAuthenticityChecksThunk());
        },
        lockDevice: isLocked => {
            deps.dispatch(lockDevice(isLocked));
        },
        migrateSuiteSyncLabelsForRbfTransaction:
            createMigrateSuiteSyncLabelsForRbfTransactionCompositionRoot({
                dispatch: deps.dispatch,
                getState: deps.getState,
                updateOutputLabel: suiteSync.labeling.updateOutputLabel,
            }),
    };
};
