import { Platform } from 'react-native';

import * as Device from 'expo-device';

import { ExtraDependencies } from '@suite-common/redux-utils';
import { extraDependenciesMock } from '@suite-common/test-utils';
import { supportedNetworkSymbols } from '@suite-native/config';
import { selectDevices } from '@suite-common/wallet-core';
import { selectFiatCurrencyCode, setFiatCurrency } from '@suite-native/module-settings';
import { PROTO } from '@trezor/connect';
import { mergeDeepObject } from '@trezor/utils';
import { NativeUsbTransport } from '@trezor/transport-native';

const protobufMessages = require('@trezor/protobuf/messages.json');

const deviceType = Device.isDevice ? 'device' : 'emulator';

const transportsPerDeviceType = {
    device: Platform.select({
        ios: ['BridgeTransport', 'UdpTransport'],
        android: [
            new NativeUsbTransport({
                messages: protobufMessages,
            }),
        ],
    }),
    emulator: ['BridgeTransport', 'UdpTransport'],
} as const;

const transports = transportsPerDeviceType[deviceType];

export const extraDependencies: ExtraDependencies = mergeDeepObject(extraDependenciesMock, {
    selectors: {
        selectEnabledNetworks: () => supportedNetworkSymbols,
        selectBitcoinAmountUnit: () => PROTO.AmountUnit.BITCOIN,
        selectLocalCurrency: selectFiatCurrencyCode,
        selectDevices,
        selectDebugSettings: () => ({
            transports,
        }),
    } as Partial<ExtraDependencies['selectors']>,
    thunks: {} as Partial<ExtraDependencies['thunks']>,
    actions: {
        setWalletSettingsLocalCurrency: setFiatCurrency,
    } as Partial<ExtraDependencies['actions']>,
    actionTypes: {} as Partial<ExtraDependencies['actionTypes']>,
    reducers: {} as Partial<ExtraDependencies['reducers']>,
    utils: {
        connectInitSettings: {
            lazyLoad: false,
            transportReconnect: false,
            debug: false,
            popup: false,
            manifest: {
                email: 'info@trezor.io',
                appUrl: '@trezor/suite',
            },
        },
    } as Partial<ExtraDependencies['utils']>,
} as OneLevelPartial<ExtraDependencies>) as ExtraDependencies;

type OneLevelPartial<T extends object> = Record<keyof T, Partial<T[keyof T]>>;
