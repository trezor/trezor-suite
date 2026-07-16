import { Platform } from 'react-native';
import RNRestart from 'react-native-restart';

import * as Device from 'expo-device';

import { createBip329CompositionRoot } from '@suite-common/bip329';
import { delegatedIdentityKeyCompositionRoot } from '@suite-common/delegated-identity-key';
import { toGetter } from '@suite-common/dependency-injection';
import { createNativePlatformEncryption } from '@suite-common/platform-encryption-native';
import {
    type ExtraDependenciesStatic,
    notImplementedAction,
    notImplementedActionType,
    notImplementedReducer,
    notImplementedSelector,
    notImplementedThunk,
} from '@suite-common/redux-utils';
import { createMigrateSuiteSyncLabelsForRbfTransactionCompositionRoot } from '@suite-common/suite-rbf-labels-migrations';
import { selectAllLabelsForAccount, selectIsSuiteSyncEnabled } from '@suite-common/suite-sync';
import { analytics } from '@suite-native/analytics';
import { forgetBluetoothDeviceThunk } from '@suite-native/bluetooth';
import { selectTokenDefinitionsEnabledNetworks } from '@suite-native/discovery';
import { selectSupportedLanguageLocale } from '@suite-native/intl';
import { reportSecurityCheck } from '@suite-native/sentry';
import { type NativeServices } from '@suite-native/services';
import type { EnsureEncryptionKeyDep, MMKVStorageDep } from '@suite-native/storage';
import { createSuiteSyncNativeCompositionRoot } from '@suite-native/suite-sync';
import { selectTradedAccountKeys, selectTradingEnvironment } from '@suite-native/trading-state';
import TrezorConnect, { type ConnectSettings, initLog } from '@trezor/connect';
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
    MMKVStorageDep;

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

    const createLogger: ConnectSettings['createLogger'] = (prefix: string) =>
        initLog(prefix, false);

    const logger = createLogger('native-transport');

    return {
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
        migrateSuiteSyncLabelsForRbfTransaction:
            createMigrateSuiteSyncLabelsForRbfTransactionCompositionRoot({
                dispatch: deps.dispatch,
                getState: deps.getState,
                updateOutputLabel: suiteSync.labeling.updateOutputLabel,
            }),
    };
};

export const extraDependencies: ExtraDependenciesStatic = {
    selectors: {
        selectLanguage: selectSupportedLanguageLocale,
        selectTokenDefinitionsEnabledNetworks,
        selectDebugSettings: () => ({
            transports,
        }),
        selectTradingEnvironment,
        selectTradedAccountKeys,
        // this selector is not used in native app, but it is used in @suite-common/trading in loadInitialDataThunk
        //  and without defining the selector, it would use extraDependenciesMock value there
        selectSelectedAccount: () => ({
            status: 'none',
            loader: undefined,
            account: undefined,
            network: undefined,
            params: undefined,
        }),
        selectThpSettings: state => ({
            // On iOS 16 and newer, deviceName is set to "iPhone" without the correct entitlement.
            hostName: (Platform.OS === 'ios' ? Device.modelName : Device.deviceName) ?? undefined,
            pairingMethods: ['CodeEntry', 'NFC'],
            knownCredentials: state.thp?.credentials,
        }),
        selectAllowPrerelease: () => false,

        // Not implemented. We assume those are NEVER called on Native
        // need for this is architectural mistake. Please DO NOT add more and try
        // to remove them.
        selectDesktopBinDir: notImplementedSelector('selectDesktopBinDir', '/bin'),
        selectSelectedAccountStatus: notImplementedSelector(
            'selectSelectedAccountStatus',
            'loaded',
        ),
        selectIsWindowVisible: notImplementedSelector('selectIsWindowVisible', true),
        selectIsViewOnlyByDefaultEnabled: notImplementedSelector(
            'selectIsViewOnlyByDefaultEnabled',
            true,
        ),
    },
    thunks: {
        forgetBluetoothDevice: forgetBluetoothDeviceThunk,

        // Not implemented. We assume those are NEVER called on Native
        // need for this is architectural mistake. Please DO NOT add more and try
        // to remove them.
        fetchAndSaveMetadata: notImplementedThunk('fetchAndSaveMetadata'),
        initMetadata: notImplementedThunk('initMetadata'),
        addAccountMetadata: notImplementedThunk('addAccountMetadata'),
    },
    actions: {
        // Not implemented. We assume those are NEVER called on Native
        // need for this is architectural mistake. Please DO NOT add more and try
        // to remove them.
        setAccountAddMetadata: notImplementedAction('setAccountAddMetadata'),
        lockDevice: notImplementedAction('lockDevice'),
        onModalCancel: notImplementedAction('onModalCancel'),
        openModal: notImplementedAction('openModal'),
    },
    actionTypes: {
        // Not implemented. We assume those are NEVER called on Native
        // need for this is architectural mistake. Please DO NOT add more and try
        // to remove them.
        storageLoad: notImplementedActionType('storageLoad'),
        setDeviceMetadata: notImplementedActionType('setDeviceMetadata'),
        setDeviceMetadataPasswords: notImplementedActionType('setDeviceMetadataPasswords'),
    },
    reducers: {
        // Not implemented. We assume those are NEVER called on Native
        // need for this is architectural mistake. Please DO NOT add more and try
        // to remove them.
        storageLoadBlockchain: notImplementedReducer('storageLoadBlockchain'),
        storageLoadExplorer: notImplementedReducer('storageLoadExplorer'),
        storageLoadAccounts: notImplementedReducer('storageLoadAccounts'),
        storageLoadTransactions: notImplementedReducer('storageLoadTransactions'),
        storageLoadPhishingMetadata: notImplementedReducer('storageLoadPhishingMetadata'),
        storageLoadHistoricRates: notImplementedReducer('storageLoadHistoricRates'),
        setDeviceMetadataReducer: notImplementedReducer('setDeviceMetadataReducer'),
        setDeviceMetadataPasswordsReducer: notImplementedReducer(
            'setDeviceMetadataPasswordsReducer',
        ),
        storageLoadDevices: notImplementedReducer('storageLoadDevices'),
        storageLoadFormDrafts: notImplementedReducer('storageLoadFormDrafts'),
        storageLoadTokenManagement: notImplementedReducer('storageLoadTokenManagement'),
        storageLoadWalletSettings: notImplementedReducer('storageLoadWalletSettings'),
        storageLoadBioAuth: notImplementedReducer('storageLoadBioAuth'),
        storageLoadFlags: notImplementedReducer('storageLoadFlags'),
        storageLoadSuiteSettings: notImplementedReducer('storageLoadSuiteSettings'),
        storageLoadReceiveAccounts: notImplementedReducer('storageLoadReceiveAccounts'),
    },
};
