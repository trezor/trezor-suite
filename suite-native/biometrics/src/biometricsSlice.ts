import { PayloadAction, createSlice, isAnyOf } from '@reduxjs/toolkit';

import { AuthenticateError, authenticate, toggleBiometricsSettings } from './biometricsThunks';

type BiometricsSliceState = {
    isUserAuthenticated: boolean;
    isBiometricsEnabled: boolean;
    biometricsError: AuthenticateError | null;
    isTogglingBiometrics: boolean;
};

type BiometricsSliceRootState = {
    biometrics: BiometricsSliceState;
};

const biometricsSliceInitialState: BiometricsSliceState = {
    isUserAuthenticated: false,
    isBiometricsEnabled: false,
    biometricsError: null,
    isTogglingBiometrics: false,
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
            .addCase(authenticate.rejected, (state, { payload }) => {
                if (payload === AuthenticateError.AuthenticationFailed) {
                    state.biometricsError = payload ?? null;
                }
            })
            .addCase(toggleBiometricsSettings.pending, state => {
                state.isTogglingBiometrics = true;
            })
            .addMatcher(
                isAnyOf(toggleBiometricsSettings.rejected, toggleBiometricsSettings.fulfilled),
                state => {
                    state.isTogglingBiometrics = false;
                },
            )
            .addMatcher(isAnyOf(authenticate.pending, authenticate.fulfilled), state => {
                state.biometricsError = null;
            });
    },
});

export const selectIsUserAuthenticated = (state: BiometricsSliceRootState) =>
    state.biometrics.isUserAuthenticated;
export const selectIsBiometricsEnabled = (state: BiometricsSliceRootState) =>
    state.biometrics.isBiometricsEnabled;

export const selectShouldUserBeAuthenticated = (state: BiometricsSliceRootState) =>
    selectIsBiometricsEnabled(state) && !state.biometrics.isUserAuthenticated;

export const selectBiometricsError = (state: BiometricsSliceRootState) =>
    state.biometrics.biometricsError;

export const selectIsTogglingBiometrics = (state: BiometricsSliceRootState) =>
    state.biometrics.isTogglingBiometrics;

export const { setIsUserAuthenticated, toggleEnableBiometrics } = biometricsSlice.actions;
