import { Platform } from 'react-native';
import RNRestart from 'react-native-restart';

import * as Device from 'expo-device';

import { createBip329CompositionRoot } from '@suite-common/bip329';
import { delegatedIdentityKeyCompositionRoot } from '@suite-common/delegated-identity-key';
import { asGetter, toGetter } from '@suite-common/dependency-injection';
import { type CommonServices, notImplementedGetter } from '@suite-common/extra-dependencies';
import { createNetworksCompositionRoot } from '@suite-common/networks';
import { createNativePlatformEncryption } from '@suite-common/platform-encryption-native';
import { createMigrateSuiteSyncLabelsForRbfTransactionCompositionRoot } from '@suite-common/suite-rbf-labels-migrations';
import { selectAllLabelsForAccount, selectIsSuiteSyncEnabled } from '@suite-common/suite-sync';
import { type NativeAnalyticsDep, analytics } from '@suite-native/analytics';
import {
    rerunFwAuthenticityChecksThunk,
    selectShouldRetryFirmwareRevisionCheckError,
} from '@suite-native/device';
import { selectTokenDefinitionsEnabledNetworks } from '@suite-native/discovery';
import { selectSupportedLanguageLocale } from '@suite-native/intl';
import { reportSecurityCheck } from '@suite-native/sentry';
import type { MMKVStorageDep } from '@suite-native/services';
import type {
    EnsureEncryptionKeyDep,
    MMKVStorageDep as NativeStorageDep,
} from '@suite-native/storage';
import { createSuiteSyncNativeCompositionRoot } from '@suite-native/suite-sync';
import { selectTradedAccountKeys, selectTradingEnvironment } from '@suite-native/trading-state';
import TrezorConnect, { type ConnectSettings, initLog } from '@trezor/connect';
import { resolveConnectPath } from '@trezor/env-utils';
import { BridgeTransport } from '@trezor/transport-common';
import { NativeBluetoothTransport } from '@trezor/transport-native-bluetooth';
import { NativeUsbTransport } from '@trezor/transport-native-usb';

const deviceType = Device.isDevice ? 'device' : 'emulator';

type NativeTransport = 'BridgeTransport' | 'NativeUsbTransport' | 'NativeBluetoothTransport';

const transportsPerDeviceType = {
    device: Platform.select<NativeTransport[]>({
        ios: ['BridgeTransport', 'NativeBluetoothTransport'],
        android: ['NativeUsbTransport', 'NativeBluetoothTransport'],
        default: ['BridgeTransport'],
    }),
    emulator: ['BridgeTransport'] satisfies NativeTransport[],
};

const transports = transportsPerDeviceType[deviceType];

type NativeAppDeps = {
    getState: () => any;
    dispatch: any;
} & EnsureEncryptionKeyDep &
    NativeStorageDep;

export type NativeServices = CommonServices & NativeAnalyticsDep & MMKVStorageDep;

export const createNativeCompositionRoot = (deps: NativeAppDeps): NativeServices => {
    const platformEncryption = createNativePlatformEncryption({
        ensureEncryptionKey: deps.ensureEncryptionKey,
    });
    const { ensureDelegatedIdentityKey } = delegatedIdentityKeyCompositionRoot({
        dispatch: deps.dispatch,
        getState: deps.getState,
        platformEncryption,
        trezorConnect: TrezorConnect,
    });

    const suiteSync = createSuiteSyncNativeCompositionRoot({
        dispatch: deps.dispatch,
        getState: deps.getState,
        platformEncryption,
        trezorConnect: TrezorConnect,
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
    const networks = createNetworksCompositionRoot();

    const createLogger: ConnectSettings['createLogger'] = (prefix: string) =>
        initLog(prefix, false);

    const logger = createLogger('native-transport');

    return {
        networks,
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
            transportReconnect: false,
            debug: false,
            manifest: {
                email: 'info@trezor.io',
                appName: 'Trezor Suite',
                appUrl: '@trezor/suite',
            },
        },
        connectInitHooks: { deviceEvent: {}, uiEvent: {} },
        createLogger,
        // Native constructs its per-device-type transports directly (single platform, no
        // web/desktop split) and returns the enabled ones as ready-made instances.
        createTransports: () =>
            (transports ?? []).map(name => {
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
        getDebugSettings: toGetter(deps.getState, () => ({ transports })),
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
        getBinFilesBaseUrl: asGetter(() => resolveConnectPath('data')),

        // Not implemented. We assume those are NEVER called on Native.
        getSelectedAccountStatus: notImplementedGetter('getSelectedAccountStatus', 'loaded'),
        getIsWindowVisible: notImplementedGetter('getIsWindowVisible', true),
        getIsViewOnlyByDefaultEnabled: notImplementedGetter('getIsViewOnlyByDefaultEnabled', true),
        migrateSuiteSyncLabelsForRbfTransaction:
            createMigrateSuiteSyncLabelsForRbfTransactionCompositionRoot({
                dispatch: deps.dispatch,
                getState: deps.getState,
                updateOutputLabel: suiteSync.labeling.updateOutputLabel,
            }),
    };
};
