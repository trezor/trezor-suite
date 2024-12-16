import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { isAndroid } from '@trezor/env-utils';
import { isDebugEnv, isDetoxTestBuild, isDevelopOrDebugEnv } from '@suite-native/config';

export const FeatureFlag = {
    IsDeviceConnectEnabled: 'isDeviceConnectEnabled',
    IsCardanoSendEnabled: 'isCardanoSendEnabled',
    IsRegtestEnabled: 'isRegtestEnabled',
    IsSolanaEnabled: 'IsSolanaEnabled',
    IsConnectPopupEnabled: 'IsConnectPopupEnabled',
    IsFirmwareUpdateEnabled: 'IsFirmwareUpdateEnabled',
} as const;
export type FeatureFlag = (typeof FeatureFlag)[keyof typeof FeatureFlag];

export type FeatureFlagsState = Record<FeatureFlag, boolean>;

export type FeatureFlagsRootState = {
    featureFlags: FeatureFlagsState;
};

export const featureFlagsInitialState: FeatureFlagsState = {
    [FeatureFlag.IsDeviceConnectEnabled]: isAndroid() || (isDebugEnv() && !isDetoxTestBuild()),
    [FeatureFlag.IsCardanoSendEnabled]: isAndroid() && isDevelopOrDebugEnv(),
    [FeatureFlag.IsRegtestEnabled]: isDebugEnv() || isDetoxTestBuild(),
    [FeatureFlag.IsSolanaEnabled]: false,
    [FeatureFlag.IsConnectPopupEnabled]: isDevelopOrDebugEnv(),
    [FeatureFlag.IsFirmwareUpdateEnabled]: isDevelopOrDebugEnv(),
};

export const featureFlagsPersistedKeys: Array<keyof FeatureFlagsState> = [
    FeatureFlag.IsDeviceConnectEnabled,
    FeatureFlag.IsCardanoSendEnabled,
    FeatureFlag.IsRegtestEnabled,
    FeatureFlag.IsSolanaEnabled,
    FeatureFlag.IsConnectPopupEnabled,
    FeatureFlag.IsFirmwareUpdateEnabled,
];

export const featureFlagsSlice = createSlice({
    name: 'featureFlags',
    initialState: featureFlagsInitialState,
    reducers: {
        toggleFeatureFlag: (state, { payload }: PayloadAction<{ featureFlag: FeatureFlag }>) => {
            state[payload.featureFlag] = !state[payload.featureFlag];
        },
    },
});

export const createSelectIsFeatureFlagEnabled =
    (featureFlagKey: FeatureFlag) => (state: FeatureFlagsRootState) =>
        state.featureFlags[featureFlagKey];

export const selectIsFeatureFlagEnabled = (state: FeatureFlagsRootState, key: FeatureFlag) =>
    state.featureFlags[key];

export const { toggleFeatureFlag } = featureFlagsSlice.actions;
export const featureFlagsReducer = featureFlagsSlice.reducer;
