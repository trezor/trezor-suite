import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { PROTO } from '@trezor/connect';
import { FiatCurrencyCode } from '@suite-common/suite-config';
import { Network, networks, NetworkSymbol } from '@suite-common/wallet-config';

export interface AppSettingsState {
    isOnboardingFinished: boolean;
    fiatCurrencyCode: FiatCurrencyCode;
    bitcoinUnits: PROTO.AmountUnit;
    viewOnlyCancelationTimestamp?: number;
}

export type SettingsSliceRootState = {
    appSettings: AppSettingsState;
};

export const appSettingsInitialState: AppSettingsState = {
    fiatCurrencyCode: 'usd',
    bitcoinUnits: PROTO.AmountUnit.BITCOIN,
    isOnboardingFinished: false,
    viewOnlyCancelationTimestamp: undefined,
};

export const appSettingsPersistWhitelist: Array<keyof AppSettingsState> = [
    'isOnboardingFinished',
    'fiatCurrencyCode',
    'bitcoinUnits',
    'viewOnlyCancelationTimestamp',
];

export const appSettingsSlice = createSlice({
    name: 'appSettings',
    initialState: appSettingsInitialState,
    reducers: {
        setFiatCurrency: (
            state,
            { payload: { localCurrency } }: PayloadAction<{ localCurrency: FiatCurrencyCode }>,
        ) => {
            state.fiatCurrencyCode = localCurrency;
        },
        setIsOnboardingFinished: state => {
            state.isOnboardingFinished = true;
        },
        setBitcoinUnits: (state, { payload }: PayloadAction<PROTO.AmountUnit>) => {
            state.bitcoinUnits = payload;
        },
        setViewOnlyCancelationTimestamp: (state, { payload }: PayloadAction<number>) => {
            state.viewOnlyCancelationTimestamp = payload;
        },
    },
});

export const selectFiatCurrencyCode = (state: SettingsSliceRootState) =>
    state.appSettings.fiatCurrencyCode;
export const selectBitcoinUnits = (state: SettingsSliceRootState) => state.appSettings.bitcoinUnits;
export const selectAreSatsAmountUnit = (state: SettingsSliceRootState) =>
    selectBitcoinUnits(state) === PROTO.AmountUnit.SATOSHI;
export const selectIsOnboardingFinished = (state: SettingsSliceRootState) =>
    state.appSettings.isOnboardingFinished;
export const selectViewOnlyCancelationTimestamp = (state: SettingsSliceRootState) =>
    state.appSettings.viewOnlyCancelationTimestamp;

export const selectIsAmountInSats = (
    state: SettingsSliceRootState,
    networkSymbol: NetworkSymbol | null | undefined,
) => {
    if (!networkSymbol) {
        return false;
    }

    const network: Network = networks[networkSymbol];
    const isAmountUnitSupported = network && network.features.includes('amount-unit');

    return isAmountUnitSupported && selectAreSatsAmountUnit(state);
};

export const {
    setIsOnboardingFinished,
    setFiatCurrency,
    setBitcoinUnits,
    setViewOnlyCancelationTimestamp,
} = appSettingsSlice.actions;
export const appSettingsReducer = appSettingsSlice.reducer;
