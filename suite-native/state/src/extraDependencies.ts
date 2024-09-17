import { Platform } from 'react-native';

import * as Device from 'expo-device';

import { ExtraDependencies } from '@suite-common/redux-utils';
import { extraDependenciesMock } from '@suite-common/test-utils';
import { selectDevices } from '@suite-common/wallet-core';
import {
    selectAreSatsAmountUnit,
    selectBitcoinUnits,
    selectFiatCurrencyCode,
    setFiatCurrency,
} from '@suite-native/settings';
import { mergeDeepObject } from '@trezor/utils';
import { NativeUsbTransport } from '@trezor/transport-native';
import { selectEnabledDiscoveryNetworkSymbols } from '@suite-native/discovery';

const deviceType = Device.isDevice ? 'device' : 'emulator';

const transportsPerDeviceType = {
    device: Platform.select({
        ios: ['BridgeTransport', 'UdpTransport'],
        android: [NativeUsbTransport],
    }),
    emulator: ['BridgeTransport', 'UdpTransport'],
} as const;

const transports = transportsPerDeviceType[deviceType];

export const extraDependencies: ExtraDependencies = mergeDeepObject(extraDependenciesMock, {
    selectors: {
        // using all enabled networks even those current device does not support,
        // otherwise disableAccountsThunk might erase accounts not supported by current device
        selectEnabledNetworks: selectEnabledDiscoveryNetworkSymbols,
        // todo: this is temporary solution to make token definitions work on native in portfolio tracker
        selectTokenDefinitionsEnabledNetworks: () => ['eth'],
        selectBitcoinAmountUnit: selectBitcoinUnits,
        selectAreSatsAmountUnit,
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
            env: 'react-native',
            popup: false,
            manifest: {
                email: 'info@trezor.io',
                appUrl: '@trezor/suite',
            },
        },
    } as Partial<ExtraDependencies['utils']>,
} as OneLevelPartial<ExtraDependencies>) as ExtraDependencies;

type OneLevelPartial<T extends object> = Record<keyof T, Partial<T[keyof T]>>;
