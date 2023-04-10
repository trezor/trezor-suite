import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { PROTO } from '@trezor/connect';
import { fiatCurrencies, FiatCurrency, FiatCurrencyCode } from '@suite-common/suite-config';

export interface AppSettingsState {
    isAccountImportFinished: boolean;
    isOnboardingFinished: boolean;
    fiatCurrency: FiatCurrency;
    bitcoinUnits: PROTO.AmountUnit;
}

export type SettingsSliceRootState = {
    appSettings: AppSettingsState;
};

export const appSettingsInitialState: AppSettingsState = {
    fiatCurrency: fiatCurrencies.usd,
    isAccountImportFinished: false,
    bitcoinUnits: PROTO.AmountUnit.BITCOIN,
    isOnboardingFinished: false,
};

export const appSettingsPersistWhitelist: Array<keyof AppSettingsState> = [
    'isAccountImportFinished',
    'isOnboardingFinished',
    'fiatCurrency',
    'bitcoinUnits',
];

export const appSettingsSlice = createSlice({
    name: 'appSettings',
    initialState: appSettingsInitialState,
    reducers: {
        setFiatCurrency: (state, { payload }: PayloadAction<FiatCurrencyCode>) => {
            state.fiatCurrency = fiatCurrencies[payload];
        },
        setIsOnboardingFinished: state => {
            state.isOnboardingFinished = true;
        },
        setIsAccountImportFinished: state => {
            state.isAccountImportFinished = true;
        },
        setBitcoinUnits: (state, { payload }: PayloadAction<PROTO.AmountUnit>) => {
            state.bitcoinUnits = payload;
        },
    },
});

export const selectFiatCurrency = (state: SettingsSliceRootState) => state.appSettings.fiatCurrency;
export const selectFiatCurrencyCode = (state: SettingsSliceRootState) =>
    state.appSettings.fiatCurrency.label;
export const selectIsAccountImportFinished = (state: SettingsSliceRootState) =>
    state.appSettings.isAccountImportFinished;
export const selectBitcoinUnits = (state: SettingsSliceRootState) => state.appSettings.bitcoinUnits;
export const selectIsOnboardingFinished = (state: SettingsSliceRootState) =>
    state.appSettings.isOnboardingFinished;

export const {
    setIsOnboardingFinished,
    setFiatCurrency,
    setIsAccountImportFinished,
    setBitcoinUnits,
} = appSettingsSlice.actions;
export const appSettingsReducer = appSettingsSlice.reducer;
