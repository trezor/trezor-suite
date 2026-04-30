import type { BiometricsSliceRootState } from './types';

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
