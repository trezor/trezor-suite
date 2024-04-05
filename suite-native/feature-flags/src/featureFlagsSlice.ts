import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { isAndroid } from '@trezor/env-utils';
import { isDebugEnv } from '@suite-native/config';

export const FeatureFlag = {
    IsDeviceConnectEnabled: 'isDeviceConnectEnabled',
    IsPassphraseEnabled: 'isPassphraseEnabled',
    IsViewOnlyEnabled: 'IsViewOnlyEnabled',
} as const;
export type FeatureFlag = (typeof FeatureFlag)[keyof typeof FeatureFlag];

export type FeatureFlagsState = Record<FeatureFlag, boolean>;

export type FeatureFlagsRootState = {
    featureFlags: FeatureFlagsState;
};

export const featureFlagsInitialState: FeatureFlagsState = {
    [FeatureFlag.IsDeviceConnectEnabled]: isAndroid(),
    [FeatureFlag.IsPassphraseEnabled]: false,
    [FeatureFlag.IsViewOnlyEnabled]: isDebugEnv(),
};

export const featureFlagsPersistedKeys: Array<keyof FeatureFlagsState> = [
    FeatureFlag.IsDeviceConnectEnabled,
    FeatureFlag.IsPassphraseEnabled,
    FeatureFlag.IsViewOnlyEnabled,
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
