import { PayloadAction, createSlice, isAnyOf } from '@reduxjs/toolkit';

import {
    AuthenticateError,
    authenticateUserThunk,
    toggleBiometricsSettingsThunk,
} from './biometricsThunks';

type BiometricsSliceState = {
    isUserAuthenticated: boolean;
    isBiometricsEnabled: boolean;
    biometricsError: AuthenticateError | null;
    isTogglingBiometricsSettingsOption: boolean;
    isAuthenticatingUser: boolean;
};

type BiometricsSliceRootState = {
    biometrics: BiometricsSliceState;
};

const biometricsSliceInitialState: BiometricsSliceState = {
    isUserAuthenticated: false,
    isBiometricsEnabled: false,
    biometricsError: null,
    isTogglingBiometricsSettingsOption: false,
    isAuthenticatingUser: false,
};

export const biometricsPersistWhitelist: Array<keyof BiometricsSliceState> = [
    'isBiometricsEnabled',
];

export const biometricsSlice = createSlice({
    name: 'biometrics',
    initialState: biometricsSliceInitialState,
    reducers: {
        setIsUserAuthenticated: (state, { payload }: PayloadAction<boolean>) => {
            state.isUserAuthenticated = payload;
        },
        toggleEnableBiometrics: (state, { payload }: PayloadAction<boolean>) => {
            state.isBiometricsEnabled = payload;
        },
    },
    extraReducers: builder => {
        builder
            .addCase(authenticateUserThunk.pending, state => {
                state.isAuthenticatingUser = true;
                state.biometricsError = null;
            })
            .addCase(authenticateUserThunk.fulfilled, state => {
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
            .addMatcher(
                isAnyOf(authenticateUserThunk.rejected, authenticateUserThunk.fulfilled),
                state => {
                    state.isAuthenticatingUser = false;
                },
            )
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

export const selectIsUserAuthenticated = (state: BiometricsSliceRootState) =>
    state.biometrics.isUserAuthenticated;
export const selectIsBiometricsEnabled = (state: BiometricsSliceRootState) =>
    state.biometrics.isBiometricsEnabled;

export const selectShouldUserBeAuthenticated = (state: BiometricsSliceRootState) =>
    selectIsBiometricsEnabled(state) && !selectIsUserAuthenticated(state);

export const selectBiometricsError = (state: BiometricsSliceRootState) =>
    state.biometrics.biometricsError;

export const selectIsTogglingBiometrics = (state: BiometricsSliceRootState) =>
    state.biometrics.isTogglingBiometricsSettingsOption;

export const selectIsAuthenticating = (state: BiometricsSliceRootState) =>
    state.biometrics.isAuthenticatingUser;

export const { setIsUserAuthenticated, toggleEnableBiometrics } = biometricsSlice.actions;
