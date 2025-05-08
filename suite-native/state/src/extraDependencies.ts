import { Platform } from 'react-native';

import * as Device from 'expo-device';

import { ExtraDependencies } from '@suite-common/redux-utils';
import { extraDependenciesMock } from '@suite-common/test-utils';
import {
    selectDeviceDiscovery,
    selectDevices,
    selectSelectedDevice,
} from '@suite-common/wallet-core';
import { selectTokenDefinitionsEnabledNetworks } from '@suite-native/discovery';
import { selectTradingEnvironment } from '@suite-native/module-trading';
import { NativeUsbTransport } from '@trezor/transport-native-usb';
import { mergeDeepObject } from '@trezor/utils';

const deviceType = Device.isDevice ? 'device' : 'emulator';

const transportsPerDeviceType = {
    device: Platform.select({
        ios: ['BridgeTransport'],
        android: [NativeUsbTransport],
    }),
    emulator: ['BridgeTransport'],
} as const;

const transports = transportsPerDeviceType[deviceType];

export const extraDependencies: ExtraDependencies = mergeDeepObject(extraDependenciesMock, {
    selectors: {
        selectDevices,
        selectTokenDefinitionsEnabledNetworks,
        selectDevice: selectSelectedDevice,
        selectDeviceDiscovery,
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
