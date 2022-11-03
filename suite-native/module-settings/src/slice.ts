import { createSlice, PayloadAction, Slice } from '@reduxjs/toolkit';

import { fiatCurrencies, FiatCurrency, FiatCurrencyCode } from '@suite-common/suite-config';

import { AppColorScheme } from './types';

export interface AppSettingsState {
    colorScheme: AppColorScheme;
    isOnboardingFinished: boolean;
    fiatCurrency: FiatCurrency;
}

type SettingsSliceRootState = {
    appSettings: AppSettingsState;
};

export const appSettingsInitialState: AppSettingsState = {
    colorScheme: 'system',
    fiatCurrency: fiatCurrencies.usd,
    isOnboardingFinished: false,
};

export const appSettingsPersistWhitelist: Array<keyof AppSettingsState> = [
    'colorScheme',
    'isOnboardingFinished',
    'fiatCurrency',
];

export const appSettingsSlice: Slice<
    AppSettingsState,
    {
        setColorScheme: (state: AppSettingsState, action: PayloadAction<AppColorScheme>) => void;
        setFiatCurrency: (
            state: AppSettingsState,
            { payload }: PayloadAction<FiatCurrencyCode>,
        ) => void;
        setOnboardingFinished: (state: AppSettingsState, action: PayloadAction<boolean>) => void;
    },
    'appSettings'
> = createSlice({
    name: 'appSettings',
    initialState: appSettingsInitialState,
    reducers: {
        setColorScheme: (state, action: PayloadAction<AppColorScheme>) => {
            state.colorScheme = action.payload;
        },
        setFiatCurrency: (state, { payload }: PayloadAction<FiatCurrencyCode>) => {
            state.fiatCurrency = fiatCurrencies[payload];
        },
        setOnboardingFinished: (state, action: PayloadAction<boolean>) => {
            state.isOnboardingFinished = action.payload;
        },
    },
});

export const selectColorScheme = (state: SettingsSliceRootState) => state.appSettings.colorScheme;
export const selectIsColorSchemeActive =
    (colorScheme: AppColorScheme) => (state: SettingsSliceRootState) =>
        state.appSettings.colorScheme === colorScheme;
export const selectFiatCurrency = (state: SettingsSliceRootState) => state.appSettings.fiatCurrency;
export const selectIsOnboardingFinished = (state: SettingsSliceRootState) =>
    state.appSettings.isOnboardingFinished;

export const { setColorScheme, setOnboardingFinished, setFiatCurrency } = appSettingsSlice.actions;
export const appSettingsReducer = appSettingsSlice.reducer;
