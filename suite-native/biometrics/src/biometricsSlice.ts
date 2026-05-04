import { createSlice, isAnyOf } from '@reduxjs/toolkit';

import {
    BiometricsToggleResult,
    authenticateUserThunk,
    handleBiometricsAppStateChangeThunk,
    toggleBiometricsSettingsThunk,
} from './biometricsThunks';
import { AuthenticateError, type BiometricsSliceState } from './types';

export const biometricsSliceInitialState: BiometricsSliceState = {
    isUserAuthenticated: false,
    isBiometricsEnabled: false,
    biometricsError: null,
    isTogglingBiometricsSettingsOption: false,
    isAuthenticatingUser: false,
    goneToBackgroundAtTimestamp: null,
};

export const biometricsPersistWhitelist: Array<keyof BiometricsSliceState> = [
    'isBiometricsEnabled',
];

export const biometricsSlice = createSlice({
    name: 'biometrics',
    initialState: biometricsSliceInitialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(authenticateUserThunk.pending, state => {
                state.biometricsError = null;
            })
            .addCase(authenticateUserThunk.fulfilled, state => {
                state.isUserAuthenticated = true;
                state.biometricsError = null;
            })
            .addCase(authenticateUserThunk.rejected, (state, { payload }) => {
                if (payload === AuthenticateError.AuthenticationFailed) {
                    state.biometricsError = payload ?? null;
                }
            })
            .addCase(toggleBiometricsSettingsThunk.pending, state => {
                state.isTogglingBiometricsSettingsOption = true;
            })
            .addCase(toggleBiometricsSettingsThunk.fulfilled, (state, { payload }) => {
                if (payload === BiometricsToggleResult.Enabled) {
                    state.isBiometricsEnabled = true;
                }

                if (payload === BiometricsToggleResult.Disabled) {
                    state.isBiometricsEnabled = false;
                }
            })
            .addCase(handleBiometricsAppStateChangeThunk.fulfilled, (state, { payload }) => {
                if (payload?.isUserAuthenticated !== undefined) {
                    state.isUserAuthenticated = payload.isUserAuthenticated;
                }

                if (payload?.goneToBackgroundAtTimestamp !== undefined) {
                    state.goneToBackgroundAtTimestamp = payload.goneToBackgroundAtTimestamp;
                }
            })
            .addMatcher(
                isAnyOf(
                    toggleBiometricsSettingsThunk.rejected,
                    toggleBiometricsSettingsThunk.fulfilled,
                ),
                state => {
                    state.isTogglingBiometricsSettingsOption = false;
                },
            );
    },
});
