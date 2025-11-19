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
    goneToBackgroundAtTimestamp: number | null;
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
    goneToBackgroundAtTimestamp: null,
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
        changeGoneToBackgroundAtTimestamp: (state, { payload }: PayloadAction<number>) => {
            state.goneToBackgroundAtTimestamp = payload;
        },
    },
    extraReducers: builder => {
        builder
            .addCase(authenticateUserThunk.pending, state => {
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

export const selectGoneToBackgroundAtTimestamp = (state: BiometricsSliceRootState) =>
    state.biometrics.goneToBackgroundAtTimestamp;

export const { setIsUserAuthenticated, toggleEnableBiometrics, changeGoneToBackgroundAtTimestamp } =
    biometricsSlice.actions;
