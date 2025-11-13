import { PayloadAction, createSlice, isAnyOf } from '@reduxjs/toolkit';

import { AuthenticateError, authenticate } from './biometricsThunks';

type BiometricsSliceState = {
    isUserAuthenticated: boolean;
    isBiometricsEnabled: boolean;
    isBiometricsOverlayVisible: boolean;
    biometricsError: AuthenticateError | null;
};

type BiometricsSliceRootState = {
    biometrics: BiometricsSliceState;
};

const biometricsSliceInitialState: BiometricsSliceState = {
    isUserAuthenticated: false,
    isBiometricsEnabled: false,
    isBiometricsOverlayVisible: true,
    biometricsError: null,
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
        setIsBiometricsOverlayVisible: (state, { payload }: PayloadAction<boolean>) => {
            state.isBiometricsOverlayVisible = state.isBiometricsEnabled ? payload : false;
        },
    },
    extraReducers: builder => {
        builder
            .addCase(authenticate.rejected, (state, { payload }) => {
                if (payload === AuthenticateError.AuthenticationFailed) {
                    state.biometricsError = payload ?? null;
                }
            })
            .addMatcher(isAnyOf(authenticate.pending, authenticate.fulfilled), state => {
                state.biometricsError = null;
            });
    },
});

export const selectIsUserAuthenticated = (state: BiometricsSliceRootState) =>
    state.biometrics.isUserAuthenticated;
export const selectIsBiometricsEnabled = (state: BiometricsSliceRootState) =>
    state.biometrics.isBiometricsEnabled;

export const selectIsBiometricsOverlayVisible = (state: BiometricsSliceRootState) =>
    selectIsBiometricsEnabled(state) && state.biometrics.isBiometricsOverlayVisible;

export const selectShouldUserBeAuthenticated = (state: BiometricsSliceRootState) =>
    selectIsBiometricsEnabled(state) && !state.biometrics.isUserAuthenticated;

export const selectBiometricsError = (state: BiometricsSliceRootState) =>
    state.biometrics.biometricsError;

export const { setIsUserAuthenticated, toggleEnableBiometrics, setIsBiometricsOverlayVisible } =
    biometricsSlice.actions;
