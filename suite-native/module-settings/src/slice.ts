import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { ThemeColorVariant } from '@trezor/theme';

export type AppColorScheme = ThemeColorVariant | 'system';

export interface AppSettingsState {
    colorScheme: AppColorScheme;
}

type SliceState = {
    appSettings: AppSettingsState;
};

const initialState: AppSettingsState = {
    colorScheme: 'system',
};

export const appSettingsSlice = createSlice({
    name: 'appSettings',
    initialState,
    reducers: {
        setColorScheme: (state, action: PayloadAction<AppColorScheme>) => {
            state.colorScheme = action.payload;
        },
    },
});

export const selectThemeVariant = (state: SliceState) => state.appSettings.colorScheme;

export const { setColorScheme } = appSettingsSlice.actions;
export const appSettingsReducer = appSettingsSlice.reducer;
