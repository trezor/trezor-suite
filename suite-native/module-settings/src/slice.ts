import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { fiatCurrencies, Currency, CurrencyType } from '@suite-common/suite-config';

import { AppColorScheme } from './types';

export interface AppSettingsState {
    colorScheme: AppColorScheme;
    fiatCurrency: Currency;
}

type SettingsSliceRootState = {
    appSettings: AppSettingsState;
};

export const initialState: AppSettingsState = {
    colorScheme: 'system',
    fiatCurrency: fiatCurrencies.usd,
};

export const appSettingsSlice = createSlice({
    name: 'appSettings',
    initialState,
    reducers: {
        setColorScheme: (state, action: PayloadAction<AppColorScheme>) => {
            state.colorScheme = action.payload;
        },
        setFiatCurrency: (state, { payload }: PayloadAction<CurrencyType>) => {
            state.fiatCurrency = fiatCurrencies[payload];
        },
    },
});

export const selectColorScheme = (state: SettingsSliceRootState) => state.appSettings.colorScheme;
export const selectIsColorSchemeActive =
    (colorScheme: AppColorScheme) => (state: SettingsSliceRootState) =>
        state.appSettings.colorScheme === colorScheme;
export const selectFiatCurrency = (state: SettingsSliceRootState) => state.appSettings.fiatCurrency;

export const { setColorScheme, setFiatCurrency } = appSettingsSlice.actions;
export const appSettingsReducer = appSettingsSlice.reducer;
