import { ExtraDependencies } from '@suite-common/redux-utils';
import { extraDependenciesMock } from '@suite-common/test-utils';
import { supportedNetworkSymbols } from '@suite-native/config';
import { selectDevices } from '@suite-common/wallet-core';
import { selectFiatCurrencyCode, setFiatCurrency } from '@suite-native/module-settings';
import { PROTO } from '@trezor/connect';
import { mergeDeepObject } from '@trezor/utils';

export const extraDependencies: ExtraDependencies = mergeDeepObject(extraDependenciesMock, {
    selectors: {
        selectEnabledNetworks: () => supportedNetworkSymbols,
        selectBitcoinAmountUnit: () => PROTO.AmountUnit.BITCOIN,
        selectLocalCurrency: selectFiatCurrencyCode,
        selectDevices,
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
            debug: true,
            popup: false,
            manifest: {
                email: 'info@trezor.io',
                appUrl: '@trezor/suite',
            },
            transports: ['NativeUsbTransport', 'UdpTransport'],
        },
    } as Partial<ExtraDependencies['utils']>,
} as OneLevelPartial<ExtraDependencies>) as ExtraDependencies;

type OneLevelPartial<T extends object> = Record<keyof T, Partial<T[keyof T]>>;
