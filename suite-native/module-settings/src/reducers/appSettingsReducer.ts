import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { ThemeColorVariant } from '@trezor/theme';
import { RootState } from '@suite-native/state';

export type AppColorScheme = ThemeColorVariant | 'system';

export interface AppSettingsState {
    colorScheme: AppColorScheme;
}

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

export const selectThemeVariant = (state: RootState) => state.appSettings.colorScheme;

export const { setColorScheme } = appSettingsSlice.actions;
export const appSettingsReducer = appSettingsSlice.reducer;
