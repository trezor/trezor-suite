import { Platform } from 'react-native';

import * as Device from 'expo-device';

import { ExtraDependencies } from '@suite-common/redux-utils';
import { extraDependenciesMock } from '@suite-common/test-utils/src/extraDependenciesMock'; // precise import path to avoid circular dependencies
import { selectSelectedDevice } from '@suite-common/wallet-core';
import { selectTokenDefinitionsEnabledNetworks } from '@suite-native/discovery';
import { selectTradingEnvironment } from '@suite-native/module-trading';
import { reportSecurityCheck } from '@suite-native/sentry';
import { NativeBluetoothTransport } from '@trezor/transport-native-bluetooth';
import { NativeUsbTransport } from '@trezor/transport-native-usb';
import { mergeDeepObject } from '@trezor/utils';

const deviceType = Device.isDevice ? 'device' : 'emulator';

const transportsPerDeviceType = {
    device: Platform.select({
        ios: ['BridgeTransport', NativeBluetoothTransport],
        android: [NativeUsbTransport, NativeBluetoothTransport],
    }),
    emulator: ['BridgeTransport'],
} as const;

const transports = transportsPerDeviceType[deviceType];

export const extraDependencies: ExtraDependencies = mergeDeepObject(extraDependenciesMock, {
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
            hostName: 'Trezor Suite', // NOTE: this is displayed on Trezor. not the same as manifest.appName
            pairingMethods: ['CodeEntry', 'NFC'],
            staticKey: state.thp?.staticKey,
            knownCredentials: state.thp?.credentials,
        }),
    } as Partial<ExtraDependencies['selectors']>,
    thunks: {} as Partial<ExtraDependencies['thunks']>,
    actions: {} as Partial<ExtraDependencies['actions']>,
    actionTypes: {} as Partial<ExtraDependencies['actionTypes']>,
    reducers: {} as Partial<ExtraDependencies['reducers']>,
    utils: {
        connectInitSettings: {
            lazyLoad: false,
            transportReconnect: false,
            debug: false,
            env: 'react-native',
            popup: false,
            manifest: {
                email: 'info@trezor.io',
                appName: 'Trezor Suite Lite',
                appUrl: '@trezor/suite',
            },
        },
        reportSecurityCheck,
    } as Partial<ExtraDependencies['utils']>,
} as OneLevelPartial<ExtraDependencies>) as ExtraDependencies;

type OneLevelPartial<T extends object> = Record<keyof T, Partial<T[keyof T]>>;
