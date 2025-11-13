import { PayloadAction, createSlice } from '@reduxjs/toolkit';

type BiometricsSliceState = {
    isUserAuthenticated: boolean;
    isBiometricsEnabled: boolean;
    isBiometricsOverlayVisible: boolean;
};

type BiometricsSliceRootState = {
    biometrics: BiometricsSliceState;
};

const biometricsSliceInitialState: BiometricsSliceState = {
    isUserAuthenticated: false,
    isBiometricsEnabled: false,
    isBiometricsOverlayVisible: true,
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
});

export const selectIsUserAuthenticated = (state: BiometricsSliceRootState) =>
    state.biometrics.isUserAuthenticated;
export const selectIsBiometricsEnabled = (state: BiometricsSliceRootState) =>
    state.biometrics.isBiometricsEnabled;

export const selectIsBiometricsOverlayVisible = (state: BiometricsSliceRootState) =>
    selectIsBiometricsEnabled(state) && state.biometrics.isBiometricsOverlayVisible;

export const { setIsUserAuthenticated, toggleEnableBiometrics, setIsBiometricsOverlayVisible } =
    biometricsSlice.actions;
