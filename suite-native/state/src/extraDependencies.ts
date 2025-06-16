import { Platform } from 'react-native';

import * as Device from 'expo-device';

import { ExtraDependencies } from '@suite-common/redux-utils';
import { extraDependenciesMock } from '@suite-common/test-utils/src/extraDependenciesMock'; // precise import path to avoid circular dependencies
import { selectSelectedDevice } from '@suite-common/wallet-core';
import { selectTokenDefinitionsEnabledNetworks } from '@suite-native/discovery';
import { selectTradingEnvironment } from '@suite-native/module-trading';
import { NativeBluetoothTransport } from '@trezor/transport-native-bluetooth';
import { NativeUsbTransport } from '@trezor/transport-native-usb';
import { mergeDeepObject } from '@trezor/utils';

const isBluetoothBuild = process.env.EXPO_PUBLIC_BLUETOOTH_ENABLED === 'true';
const deviceType = Device.isDevice ? 'device' : 'emulator';

const transportsPerDeviceType = {
    device: Platform.select({
        ios: isBluetoothBuild ? ['BridgeTransport', NativeBluetoothTransport] : ['BridgeTransport'],
        android: isBluetoothBuild
            ? [NativeUsbTransport, NativeBluetoothTransport]
            : [NativeUsbTransport],
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
    } as Partial<ExtraDependencies['utils']>,
} as OneLevelPartial<ExtraDependencies>) as ExtraDependencies;

type OneLevelPartial<T extends object> = Record<keyof T, Partial<T[keyof T]>>;
