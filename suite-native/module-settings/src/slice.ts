import { createSlice, PayloadAction, Slice } from '@reduxjs/toolkit';

import { fiatCurrencies, FiatCurrency, FiatCurrencyCode } from '@suite-common/suite-config';

export interface AppSettingsState {
    isOnboardingFinished: boolean;
    fiatCurrency: FiatCurrency;
}

export type SettingsSliceRootState = {
    appSettings: AppSettingsState;
};

export const appSettingsInitialState: AppSettingsState = {
    fiatCurrency: fiatCurrencies.usd,
    isOnboardingFinished: false,
};

export const appSettingsPersistWhitelist: Array<keyof AppSettingsState> = [
    'isOnboardingFinished',
    'fiatCurrency',
];

export const appSettingsSlice: Slice<
    AppSettingsState,
    {
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
        setFiatCurrency: (state, { payload }: PayloadAction<FiatCurrencyCode>) => {
            state.fiatCurrency = fiatCurrencies[payload];
        },
        setOnboardingFinished: (state, action: PayloadAction<boolean>) => {
            state.isOnboardingFinished = action.payload;
        },
    },
});

export const selectFiatCurrency = (state: SettingsSliceRootState) => state.appSettings.fiatCurrency;
export const selectFiatCurrencyCode = (state: SettingsSliceRootState) =>
    state.appSettings.fiatCurrency.label;
export const selectIsOnboardingFinished = (state: SettingsSliceRootState) =>
    state.appSettings.isOnboardingFinished;

export const { setOnboardingFinished, setFiatCurrency } = appSettingsSlice.actions;
export const appSettingsReducer = appSettingsSlice.reducer;
