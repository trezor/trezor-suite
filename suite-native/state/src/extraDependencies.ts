import { Platform } from 'react-native';

import * as Device from 'expo-device';

import { delegatedIdentityKeyCompositionRoot } from '@suite-common/delegated-identity-key';
import { createNativePlatformEncryption } from '@suite-common/platform-encryption-native';
import { ExtraDependencies, ExtraDependenciesStatic } from '@suite-common/redux-utils';
import { selectIsSuiteSyncEnabled } from '@suite-common/suite-sync';
import { extraDependenciesMock } from '@suite-common/test-utils/src/extraDependenciesMock'; // precise import path to avoid circular dependencies
import { selectSelectedDevice } from '@suite-common/wallet-core';
import {
    type NativeAnalyticsDep,
    type NativeLegacyAnalyticsDep,
    createAnalytics,
    createLegacyAnalytics,
} from '@suite-native/analytics';
import { forgetBluetoothDeviceThunk } from '@suite-native/bluetooth';
import { selectTokenDefinitionsEnabledNetworks } from '@suite-native/discovery';
import { reportSecurityCheck } from '@suite-native/sentry';
import { NativeServices } from '@suite-native/services';
import type { EnsureEncryptionKeyDep, MMKVStorageDep } from '@suite-native/storage';
import { createSuiteSyncNativeCompositionRoot } from '@suite-native/suite-sync';
import { selectTradingEnvironment } from '@suite-native/trading-state';
import TrezorConnect from '@trezor/connect';
import messages from '@trezor/protobuf/messages.json';
import { BridgeTransport } from '@trezor/transport';
import { NativeBluetoothTransport } from '@trezor/transport-native-bluetooth';
import { NativeUsbTransport } from '@trezor/transport-native-usb';
import { mergeDeepObject } from '@trezor/utils';

const deviceType = Device.isDevice ? 'device' : 'emulator';

const bridgeTransport = new BridgeTransport({ messages, port: 21328, id: 'bridge' });

const transportsPerDeviceType = {
    device: Platform.select({
        ios: [bridgeTransport, NativeBluetoothTransport],
        android: [NativeUsbTransport, NativeBluetoothTransport],
    }),
    emulator: [bridgeTransport],
} as const;

const transports = transportsPerDeviceType[deviceType];

type NativeAppDeps = {
    getState: () => any;
    dispatch: any;
} & EnsureEncryptionKeyDep &
    MMKVStorageDep;

export const createNativeCompositionRoot = (
    deps: NativeAppDeps,
): NativeServices & NativeAnalyticsDep & NativeLegacyAnalyticsDep => {
    const platformEncryption = createNativePlatformEncryption({
        ensureEncryptionKey: deps.ensureEncryptionKey,
    });
    const { ensureDelegatedIdentityKey } = delegatedIdentityKeyCompositionRoot({
        dispatch: deps.dispatch,
        getState: deps.getState,
        platformEncryption,
        trezorConnect: TrezorConnect,
    });

    return {
        suiteSync: createSuiteSyncNativeCompositionRoot({
            dispatch: deps.dispatch,
            getState: deps.getState,
            platformEncryption,
            trezorConnect: TrezorConnect,
            ensureDelegatedIdentityKey,
        }),
        platformEncryption,
        getMMKVStorage: () => deps.mmkvStorage.getMMKV(),
        legacyAnalytics: createLegacyAnalytics(),
        analytics: createAnalytics(),
    };
};

// @TODO test code (extraDependenciesMock) shouldn't be used in production!
export const extraDependencies: ExtraDependenciesStatic = mergeDeepObject(
    extraDependenciesMock as ExtraDependencies,
    {
        selectors: {
            selectTokenDefinitionsEnabledNetworks,
            selectDevice: selectSelectedDevice,
            selectDebugSettings: () => ({
                transports,
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
                hostName: Platform.OS === 'ios' ? Device.modelName : Device.deviceName,
                pairingMethods: ['CodeEntry', 'NFC'],
                knownCredentials: state.thp?.credentials,
            }),
            selectIsSuiteSyncEnabled,
        } as Partial<ExtraDependenciesStatic['selectors']>,
        thunks: {
            forgetBluetoothDevice: forgetBluetoothDeviceThunk,
        } as Partial<ExtraDependenciesStatic['thunks']>,
        actions: {} as Partial<ExtraDependenciesStatic['actions']>,
        actionTypes: {} as Partial<ExtraDependenciesStatic['actionTypes']>,
        reducers: {} as Partial<ExtraDependenciesStatic['reducers']>,
        utils: {
            connectInitSettings: {
                lazyLoad: false,
                transportReconnect: false,
                debug: false,
                env: 'react-native',
                popup: false,
                manifest: {
                    email: 'info@trezor.io',
                    appName: 'Trezor Suite',
                    appUrl: '@trezor/suite',
                },
            },
            reportSecurityCheck,
        } as Partial<ExtraDependenciesStatic['utils']>,
    } as OneLevelPartial<ExtraDependenciesStatic>,
) as ExtraDependenciesStatic;

type OneLevelPartial<T extends object> = Record<keyof T, Partial<T[keyof T]>>;
