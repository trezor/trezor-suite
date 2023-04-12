import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { PROTO } from '@trezor/connect';
import { fiatCurrencies, FiatCurrency, FiatCurrencyCode } from '@suite-common/suite-config';

export interface AppSettingsState {
    isOnboardingFinished: boolean;
    fiatCurrency: FiatCurrency;
    bitcoinUnits: PROTO.AmountUnit;
}

export type SettingsSliceRootState = {
    appSettings: AppSettingsState;
};

export const appSettingsInitialState: AppSettingsState = {
    fiatCurrency: fiatCurrencies.usd,
    bitcoinUnits: PROTO.AmountUnit.BITCOIN,
    isOnboardingFinished: false,
};

export const appSettingsPersistWhitelist: Array<keyof AppSettingsState> = [
    'isOnboardingFinished',
    'fiatCurrency',
    'bitcoinUnits',
];

export const appSettingsSlice = createSlice({
    name: 'appSettings',
    initialState: appSettingsInitialState,
    reducers: {
        setFiatCurrency: (
            state,
            { payload: { localCurrency } }: PayloadAction<{ localCurrency: FiatCurrencyCode }>,
        ) => {
            state.fiatCurrency = fiatCurrencies[localCurrency];
        },
        setIsOnboardingFinished: state => {
            state.isOnboardingFinished = true;
        },
        setBitcoinUnits: (state, { payload }: PayloadAction<PROTO.AmountUnit>) => {
            state.bitcoinUnits = payload;
        },
    },
});

export const selectFiatCurrency = (state: SettingsSliceRootState) => state.appSettings.fiatCurrency;
export const selectFiatCurrencyCode = (state: SettingsSliceRootState) =>
    state.appSettings.fiatCurrency.label;
export const selectBitcoinUnits = (state: SettingsSliceRootState) => state.appSettings.bitcoinUnits;
export const selectIsOnboardingFinished = (state: SettingsSliceRootState) =>
    state.appSettings.isOnboardingFinished;

export const { setIsOnboardingFinished, setFiatCurrency, setBitcoinUnits } =
    appSettingsSlice.actions;
export const appSettingsReducer = appSettingsSlice.reducer;
