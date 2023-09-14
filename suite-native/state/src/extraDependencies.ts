import { ExtraDependencies } from '@suite-common/redux-utils';
import { extraDependenciesMock } from '@suite-common/test-utils';
import { enabledNetworks } from '@suite-native/config';
import { selectFiatCurrencyCode, setFiatCurrency } from '@suite-native/module-settings';
import { PROTO } from '@trezor/connect';
import { mergeDeepObject } from '@trezor/utils';
import { selectDevice } from '@suite-common/wallet-core';

export const extraDependencies: ExtraDependencies = mergeDeepObject(extraDependenciesMock, {
    selectors: {
        selectEnabledNetworks: () => enabledNetworks,
        selectDevice,
        selectBitcoinAmountUnit: () => PROTO.AmountUnit.BITCOIN,
        selectLocalCurrency: selectFiatCurrencyCode,
    } as Partial<ExtraDependencies['selectors']>,
    thunks: {} as Partial<ExtraDependencies['thunks']>,
    actions: {
        setWalletSettingsLocalCurrency: setFiatCurrency,
    } as Partial<ExtraDependencies['actions']>,
    actionTypes: {} as Partial<ExtraDependencies['actionTypes']>,
    reducers: {} as Partial<ExtraDependencies['reducers']>,
    utils: {} as Partial<ExtraDependencies['utils']>,
} as OneLevelPartial<ExtraDependencies>) as ExtraDependencies;

type OneLevelPartial<T extends object> = Record<keyof T, Partial<T[keyof T]>>;
