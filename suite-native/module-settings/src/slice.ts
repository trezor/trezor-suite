import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { fiatCurrencies, FiatCurrency, FiatCurrencyCode } from '@suite-common/suite-config';

export interface AppSettingsState {
    isOnboardingFinished: boolean;
    fiatCurrency: FiatCurrency;
    isSatsEnabled: boolean;
}

export type SettingsSliceRootState = {
    appSettings: AppSettingsState;
};

export const appSettingsInitialState: AppSettingsState = {
    fiatCurrency: fiatCurrencies.usd,
    isOnboardingFinished: false,
    isSatsEnabled: false,
};

export const appSettingsPersistWhitelist: Array<keyof AppSettingsState> = [
    'isOnboardingFinished',
    'fiatCurrency',
    'isSatsEnabled',
];

export const appSettingsSlice = createSlice({
    name: 'appSettings',
    initialState: appSettingsInitialState,
    reducers: {
        setFiatCurrency: (state, { payload }: PayloadAction<FiatCurrencyCode>) => {
            state.fiatCurrency = fiatCurrencies[payload];
        },
        setOnboardingFinished: (state, action: PayloadAction<boolean>) => {
            state.isOnboardingFinished = action.payload;
        },
        toggleIsSatsEnabled: state => {
            state.isSatsEnabled = !state.isSatsEnabled;
        },
    },
});

export const selectFiatCurrency = (state: SettingsSliceRootState) => state.appSettings.fiatCurrency;
export const selectFiatCurrencyCode = (state: SettingsSliceRootState) =>
    state.appSettings.fiatCurrency.label;
export const selectIsOnboardingFinished = (state: SettingsSliceRootState) =>
    state.appSettings.isOnboardingFinished;
export const selectIsSatsEnabled = (state: SettingsSliceRootState) =>
    state.appSettings.isSatsEnabled;

export const { setOnboardingFinished, setFiatCurrency, toggleIsSatsEnabled } =
    appSettingsSlice.actions;
export const appSettingsReducer = appSettingsSlice.reducer;
