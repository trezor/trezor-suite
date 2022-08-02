import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { fiatCurrenciesMap, Currency, CurrencyType } from '@suite-common/suite-config';

import { AppColorScheme } from './types';

export interface AppSettingsState {
    colorScheme: AppColorScheme;
    currency: Currency;
}

type SliceState = {
    appSettings: AppSettingsState;
};

const initialState: AppSettingsState = {
    colorScheme: 'system',
    currency: fiatCurrenciesMap.usd,
};

export const appSettingsSlice = createSlice({
    name: 'appSettings',
    initialState,
    reducers: {
        setColorScheme: (state, action: PayloadAction<AppColorScheme>) => {
            state.colorScheme = action.payload;
        },
        setCurrency: (state, { payload }: PayloadAction<CurrencyType>) => {
            state.currency = fiatCurrenciesMap[payload];
        },
    },
});

export const selectColorScheme = (state: SliceState) => state.appSettings.colorScheme;
export const selectIsColorSchemeActive = (colorScheme: AppColorScheme) => (state: SliceState) =>
    state.appSettings.colorScheme === colorScheme;
export const selectCurrency = (state: SliceState) => state.appSettings.currency;

export const { setColorScheme, setCurrency } = appSettingsSlice.actions;
export const appSettingsReducer = appSettingsSlice.reducer;
