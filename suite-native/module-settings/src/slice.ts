import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { ThemeColorVariant } from '@trezor/theme';

export type AppColorScheme = ThemeColorVariant | 'system';

export interface AppSettingsState {
    colorScheme: AppColorScheme;
    isOnboardingFinished: boolean;
}

type SliceState = {
    appSettings: AppSettingsState;
};

const initialState: AppSettingsState = {
    colorScheme: 'system',
    isOnboardingFinished: false,
};

export const appSettingsPersistWhitelist = ['colorScheme', 'isOnboardingFinished'];

export const appSettingsSlice = createSlice({
    name: 'appSettings',
    initialState,
    reducers: {
        setColorScheme: (state, action: PayloadAction<AppColorScheme>) => {
            state.colorScheme = action.payload;
        },
        setOnboardingFinished: (state, action: PayloadAction<boolean>) => {
            state.isOnboardingFinished = action.payload;
        },
    },
});

export const selectColorScheme = (state: SliceState) => state.appSettings.colorScheme;
export const selectIsColorSchemeActive = (colorScheme: AppColorScheme) => (state: SliceState) =>
    state.appSettings.colorScheme === colorScheme;
export const selectIsOnboardingFinished = (state: SliceState) =>
    state.appSettings.isOnboardingFinished;

export const { setColorScheme, setOnboardingFinished } = appSettingsSlice.actions;
export const appSettingsReducer = appSettingsSlice.reducer;
