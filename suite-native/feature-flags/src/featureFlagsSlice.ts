import { Platform } from 'react-native';

import { createSlice } from '@reduxjs/toolkit';

export interface FeatureFlagsState {
    isDeviceConnectEnabled: boolean;
}

export type FeatureFlagsRootState = {
    featureFlags: FeatureFlagsState;
};

export const featureFlagsInitialState: FeatureFlagsState = {
    isDeviceConnectEnabled: Platform.OS === 'android',
};

export const featureFlagsPersistedKeys: Array<keyof FeatureFlagsState> = ['isDeviceConnectEnabled'];

export const featureFlagsSlice = createSlice({
    name: 'featureFlags',
    initialState: featureFlagsInitialState,
    reducers: {
        toggleIsDeviceConnectEnabled: state => {
            state.isDeviceConnectEnabled = !state.isDeviceConnectEnabled;
        },
    },
});

export const selectIsDeviceConnectFeatureFlagEnabled = (state: FeatureFlagsRootState) =>
    state.featureFlags.isDeviceConnectEnabled;

export const { toggleIsDeviceConnectEnabled } = featureFlagsSlice.actions;
export const featureFlagsReducer = featureFlagsSlice.reducer;
