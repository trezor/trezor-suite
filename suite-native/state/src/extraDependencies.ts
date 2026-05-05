import { Platform } from 'react-native';

import * as Device from 'expo-device';

import { type Bip329 } from '@suite-common/bip329-types';
import { delegatedIdentityKeyCompositionRoot } from '@suite-common/delegated-identity-key';
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
import { AddressDisplayOptions } from '@suite-common/wallet-types';
import { analytics } from '@suite-native/analytics';
import { forgetBluetoothDeviceThunk } from '@suite-native/bluetooth';
import { selectTokenDefinitionsEnabledNetworks } from '@suite-native/discovery';
import { selectSupportedLanguageLocale } from '@suite-native/intl';
import { reportSecurityCheck } from '@suite-native/sentry';
import { type NativeServices } from '@suite-native/services';
import type { EnsureEncryptionKeyDep, MMKVStorageDep } from '@suite-native/storage';
import { createSuiteSyncNativeCompositionRoot } from '@suite-native/suite-sync';
import { selectTradingEnvironment } from '@suite-native/trading-state';
import TrezorConnect from '@trezor/connect';
import { BridgeTransport } from '@trezor/transport';
import { NativeBluetoothTransport } from '@trezor/transport-native-bluetooth';
import { NativeUsbTransport } from '@trezor/transport-native-usb';
import { ok } from '@trezor/type-utils';

import { selectShowConnectLogs } from './connectDebugSlice';

const deviceType = Device.isDevice ? 'device' : 'emulator';

const bridgeTransport = new BridgeTransport({ port: 21328, id: 'bridge' });

const transportsPerDeviceType = {
    device: Platform.select({
        ios: [bridgeTransport, NativeBluetoothTransport],
        android: [NativeUsbTransport, NativeBluetoothTransport],
    }),
    emulator: [bridgeTransport],
} as const;

const transports = transportsPerDeviceType[deviceType];

const bip329: Bip329 = {
    export: () => ({ accountLabel: null, labelsToExport: [] }),
    import: () => Promise.resolve(ok()),
};

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
    });

    return {
        suiteSync,
        bip329,
        ensureDelegatedIdentityKey,
        platformEncryption,
        analytics,
        getMMKVStorage: () => deps.mmkvStorage.getMMKV(),
        reportSecurityCheck,
        saveAs: (data, fileName) =>
            console.warn(
                `Save data: ${data} into file: ${fileName}. Implementation on phone not ready.`,
            ),
        connectInitSettings: {
            transportReconnect: false,
            debug: false,
            env: 'react-native',
            manifest: {
                email: 'info@trezor.io',
                appName: 'Trezor Suite',
                appUrl: '@trezor/suite',
            },
        },
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
        selectDebugSettings: state => ({
            transports,
            showConnectLogs: selectShowConnectLogs(state),
        }),
        selectTradingEnvironment,
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
        selectAddressDisplayType: notImplementedSelector(
            'selectAddressDisplayType',
            AddressDisplayOptions.CHUNKED,
        ),
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
    },
};
