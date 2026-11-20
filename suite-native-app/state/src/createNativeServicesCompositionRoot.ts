import { Platform } from 'react-native';
import RNRestart from 'react-native-restart';

import * as Device from 'expo-device';

import { createBip329CompositionRoot } from '@suite-common/bip329';
import { delegatedIdentityKeyCompositionRoot } from '@suite-common/delegated-identity-key';
import { createStakingCompositionRoot } from '@suite-common/earn-staking';
import { createStakingProductsCompositionRoot } from '@suite-common/earn-staking-products';
import { notImplementedGetter } from '@suite-common/extra-dependencies';
import { createNetworksCompositionRoot } from '@suite-common/networks';
import { createNativePlatformEncryption } from '@suite-common/platform-encryption-native';
import { createQueryClient } from '@suite-common/react-query';
import { createSignVerify } from '@suite-common/sign-verify';
import { createMigrateSuiteSyncLabelsForRbfTransactionCompositionRoot } from '@suite-common/suite-rbf-labels-migrations';
import { selectAllLabelsForAccount, selectIsSuiteSyncEnabled } from '@suite-common/suite-sync';
import { analytics } from '@suite-native/analytics';
import {
    rerunFwAuthenticityChecksThunk,
    selectShouldRetryFirmwareRevisionCheckError,
} from '@suite-native/device';
import { selectTokenDefinitionsEnabledNetworks } from '@suite-native/discovery';
import { selectSupportedLanguageLocale } from '@suite-native/intl';
import { reportSecurityCheck } from '@suite-native/sentry';
import { type NativeDebugTransport, selectDebugTransports } from '@suite-native/settings';
import type { EnsureEncryptionKeyDep, MMKVStorageDep } from '@suite-native/storage';
import { selectTradedAccountKeys, selectTradingEnvironment } from '@suite-native/trading-shared';
import { createSuiteSyncNativeCompositionRoot } from '@suite-native-app/suite-sync';
import { type ConnectSettings, type GetTrezorConnectPrivilegedDep, initLog } from '@trezor/connect';
import { asGetter, toGetter } from '@trezor/dependency-injection';
import { resolveConnectPath } from '@trezor/env-utils';
import { createBitcoinSuiteCommonNetworkModule } from '@trezor/network-bitcoin-suite-common';
import { createCardanoSuiteCommonNetworkModule } from '@trezor/network-cardano-suite-common';
import { createEthereumSuiteCommonNetworkModule } from '@trezor/network-ethereum-suite-common';
import { createRippleSuiteCommonNetworkModule } from '@trezor/network-ripple-suite-common';
import { createSolanaSuiteCommonNetworkModule } from '@trezor/network-solana-suite-common';
import { createStellarSuiteCommonNetworkModule } from '@trezor/network-stellar-suite-common';
import { createTronSuiteCommonNetworkModule } from '@trezor/network-tron-suite-common';
import { BridgeTransport } from '@trezor/transport-common';
import { NativeBluetoothTransport } from '@trezor/transport-native-bluetooth';
import { NativeUsbTransport } from '@trezor/transport-native-usb';

import { type NativeServices } from './NativeServices';
import { createNativeStakingDeviceAccess } from './createNativeStakingDeviceAccess';
import { type NativeReduxStore } from './createReduxStore';

const deviceType = Device.isDevice ? 'device' : 'emulator';

const transportsPerDeviceType = {
    device: Platform.select<NativeDebugTransport[]>({
        ios: ['NativeBluetoothTransport'],
        android: ['NativeUsbTransport', 'NativeBluetoothTransport'],
        default: ['BridgeTransport'],
    }),
    emulator: ['BridgeTransport'] satisfies NativeDebugTransport[],
};

const transports = transportsPerDeviceType[deviceType];

type NativeAppDeps = Pick<NativeReduxStore, 'getState' | 'dispatch'> &
    EnsureEncryptionKeyDep &
    MMKVStorageDep &
    GetTrezorConnectPrivilegedDep;

export const createNativeServicesCompositionRoot = (deps: NativeAppDeps): NativeServices => {
    const platformEncryption = createNativePlatformEncryption({
        ensureEncryptionKey: deps.ensureEncryptionKey,
    });
    const { ensureDelegatedIdentityKey } = delegatedIdentityKeyCompositionRoot({
        dispatch: deps.dispatch,
        getState: deps.getState,
        platformEncryption,
        getTrezorConnect: deps.getTrezorConnect,
    });

    const suiteSync = createSuiteSyncNativeCompositionRoot({
        dispatch: deps.dispatch,
        getState: deps.getState,
        platformEncryption,
        getTrezorConnect: deps.getTrezorConnect,
        ensureDelegatedIdentityKey,
        analytics,
        fetch: globalThis.fetch.bind(globalThis),
    });

    const { bip329 } = createBip329CompositionRoot({
        getIsSuiteSyncEnabled: toGetter(deps.getState, selectIsSuiteSyncEnabled),
        // Legacy metadata labeling is not used on native — suite-sync is the only path.
        getLegacyAccountLabels: () => ({ outputLabels: {}, addressLabels: {} }),
        getAllLabelsForAccount: toGetter(deps.getState, selectAllLabelsForAccount),
        updateAddressLabel: suiteSync.labeling.updateAddressLabel,
        updateOutputLabel: suiteSync.labeling.updateOutputLabel,
    });
    const networks = createNetworksCompositionRoot({
        networkModules: [
            createBitcoinSuiteCommonNetworkModule(deps),
            createEthereumSuiteCommonNetworkModule(deps),
            createRippleSuiteCommonNetworkModule(),
            createCardanoSuiteCommonNetworkModule(deps),
            createSolanaSuiteCommonNetworkModule(),
            createStellarSuiteCommonNetworkModule(),
            createTronSuiteCommonNetworkModule(),
        ],
        dispatch: deps.dispatch,
    });

    const staking = createStakingCompositionRoot({
        platform: 'mobile',
        adapters: createStakingProductsCompositionRoot(),
        deviceAccess: createNativeStakingDeviceAccess({
            getTrezorConnect: deps.getTrezorConnect,
        }),
        dispatch: deps.dispatch,
    });

    const queryClient = createQueryClient({ shouldRefetchOnEvents: false });

    const createLogger: ConnectSettings['createLogger'] = (prefix: string) =>
        initLog(prefix, false);

    const logger = createLogger('native-transport');

    return {
        networks,
        signVerify: createSignVerify({
            networkModuleRepository: networks.networkModuleRepository,
            analytics,
            dispatch: deps.dispatch,
        }),
        staking,
        queryClient,
        suiteSync,
        bip329,
        ensureDelegatedIdentityKey,
        platformEncryption,
        analytics,
        getMMKVStorage: () => deps.mmkvStorage.getMMKV(),
        reportSecurityCheck,
        reloadApp: RNRestart.restart,
        saveAs: (data, fileName) =>
            console.warn(
                `Save data: ${data} into file: ${fileName}. Implementation on phone not ready.`,
            ),
        connectInitSettings: {
            debug: false,
            manifest: {
                email: 'info@trezor.io',
                appName: 'Trezor Suite',
                appUrl: '@trezor/suite',
            },
        },
        connectInitDeviceEventHooks: {},
        connectInitUIEventHooks: {},
        createLogger,
        createTransports: debugTransports =>
            (debugTransports.length > 0 ? debugTransports : (transports ?? []))
                .filter(
                    (name): name is NativeDebugTransport =>
                        name === 'BridgeTransport' ||
                        name === 'NativeBluetoothTransport' ||
                        (name === 'NativeUsbTransport' && Platform.OS === 'android'),
                )
                .map(name => {
                    switch (name) {
                        case 'BridgeTransport':
                            return new BridgeTransport({ port: 21328, id: 'bridge', logger });
                        case 'NativeUsbTransport':
                            return new NativeUsbTransport({ id: 'native-usb', logger });
                        case 'NativeBluetoothTransport':
                            return new NativeBluetoothTransport({ id: 'native-bluetooth', logger });
                    }
                }),
        getLanguage: toGetter(deps.getState, selectSupportedLanguageLocale),
        getTokenDefinitionsEnabledNetworks: toGetter(
            deps.getState,
            selectTokenDefinitionsEnabledNetworks,
        ),
        getDebugSettings: toGetter(deps.getState, state => ({
            transports: selectDebugTransports(state),
            showConnectLogs: false,
        })),
        getTradingEnvironment: toGetter(deps.getState, selectTradingEnvironment),
        getTradedAccountKeys: toGetter(deps.getState, selectTradedAccountKeys),
        // This getter is not used in native app, but it is used in @suite-common/trading in loadInitialDataThunk.
        getSelectedAccount: toGetter(deps.getState, () => ({
            status: 'none',
            loader: undefined,
            account: undefined,
            network: undefined,
            params: undefined,
        })),
        getThpSettings: toGetter(deps.getState, state => ({
            // On iOS 16 and newer, deviceName is set to "iPhone" without the correct entitlement.
            hostName: (Platform.OS === 'ios' ? Device.modelName : Device.deviceName) ?? undefined,
            pairingMethods: ['CodeEntry', 'NFC'],
            knownCredentials: state.thp?.credentials,
        })),
        getAllowPrerelease: toGetter(deps.getState, () => false),
        shouldRetryFirmwareRevisionCheckError: toGetter(
            deps.getState,
            selectShouldRetryFirmwareRevisionCheckError,
        ),
        rerunFwAuthenticityChecksCall: () => {
            deps.dispatch(rerunFwAuthenticityChecksThunk());
        },
        lockDevice: () => {},
        getBinFilesBaseUrl: asGetter(() => resolveConnectPath('data')),

        // Not implemented. We assume those are NEVER called on Native.
        getIsWindowVisible: notImplementedGetter('getIsWindowVisible', true),
        migrateSuiteSyncLabelsForRbfTransaction:
            createMigrateSuiteSyncLabelsForRbfTransactionCompositionRoot({
                dispatch: deps.dispatch,
                getState: deps.getState,
                updateOutputLabel: suiteSync.labeling.updateOutputLabel,
            }),
    };
};
