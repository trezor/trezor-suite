import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { isAndroid } from '@trezor/env-utils';
import { isDebugEnv, isDetoxTestBuild, isDevelopOrDebugEnv } from '@suite-native/config';

export const FeatureFlag = {
    IsDeviceConnectEnabled: 'isDeviceConnectEnabled',
    IsRippleSendEnabled: 'isRippleSendEnabled',
    IsCardanoSendEnabled: 'isCardanoSendEnabled',
    IsSolanaSendEnabled: 'isSolanaSendEnabled',
    IsRegtestEnabled: 'isRegtestEnabled',
    IsSolanaEnabled: 'IsSolanaEnabled',
    IsConnectPopupEnabled: 'IsConnectPopupEnabled',
} as const;
export type FeatureFlag = (typeof FeatureFlag)[keyof typeof FeatureFlag];

export type FeatureFlagsState = Record<FeatureFlag, boolean>;

export type FeatureFlagsRootState = {
    featureFlags: FeatureFlagsState;
};

export const featureFlagsInitialState: FeatureFlagsState = {
    [FeatureFlag.IsDeviceConnectEnabled]: isAndroid() || isDebugEnv(),
    [FeatureFlag.IsRippleSendEnabled]: isAndroid() && isDevelopOrDebugEnv(),
    [FeatureFlag.IsCardanoSendEnabled]: isAndroid() && isDevelopOrDebugEnv(),
    [FeatureFlag.IsSolanaSendEnabled]: isAndroid() && isDevelopOrDebugEnv(),
    [FeatureFlag.IsRegtestEnabled]: isDebugEnv() || isDetoxTestBuild(),
    [FeatureFlag.IsSolanaEnabled]: false,
    [FeatureFlag.IsConnectPopupEnabled]: isDevelopOrDebugEnv(),
};

export const featureFlagsPersistedKeys: Array<keyof FeatureFlagsState> = [
    FeatureFlag.IsDeviceConnectEnabled,
    FeatureFlag.IsRippleSendEnabled,
    FeatureFlag.IsCardanoSendEnabled,
    FeatureFlag.IsSolanaSendEnabled,
    FeatureFlag.IsRegtestEnabled,
    FeatureFlag.IsSolanaEnabled,
    FeatureFlag.IsConnectPopupEnabled,
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

export const selectIsFeatureFlagEnabled = (state: FeatureFlagsRootState, key: FeatureFlag) =>
    state.featureFlags[key];

export const { toggleFeatureFlag } = featureFlagsSlice.actions;
export const featureFlagsReducer = featureFlagsSlice.reducer;
