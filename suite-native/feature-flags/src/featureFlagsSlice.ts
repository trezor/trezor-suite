import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

export const FeatureFlag = {
    AreDebugOnlyNetworksEnabled: 'areDebugOnlyNetworksEnabled',
    AreExperimentalOnlyNetworksEnabled: 'areExperimentalOnlyNetworksEnabled',
    IsCardanoSendEnabled: 'isCardanoSendEnabled',
    IsDebugKeysAllowed: 'isDebugKeysAllowed',
    IsTradingDebugEnabled: 'isTradingDebugEnabled',
    IsN4w1BackupEnabled: 'isN4w1BackupEnabled',
} as const;

export type FeatureFlag = (typeof FeatureFlag)[keyof typeof FeatureFlag];

export type FeatureFlagsState = Record<FeatureFlag, boolean>;

export type FeatureFlagsRootState = {
    featureFlags: FeatureFlagsState;
};

export const featureFlagsInitialState: FeatureFlagsState = {
    [FeatureFlag.AreDebugOnlyNetworksEnabled]:
        process.env.EXPO_PUBLIC_FF_ARE_DEBUG_ONLY_NETWORKS_ENABLED === 'true',
    [FeatureFlag.AreExperimentalOnlyNetworksEnabled]:
        process.env.EXPO_PUBLIC_FF_ARE_EXPERIMENTAL_ONLY_NETWORKS_ENABLED === 'true',
    [FeatureFlag.IsCardanoSendEnabled]:
        process.env.EXPO_PUBLIC_FF_IS_CARDANO_SEND_ENABLED === 'true',
    [FeatureFlag.IsDebugKeysAllowed]: process.env.EXPO_PUBLIC_FF_IS_DEBUG_KEYS_ALLOWED === 'true',
    [FeatureFlag.IsTradingDebugEnabled]:
        process.env.EXPO_PUBLIC_FF_IS_TRADING_DEBUG_ENABLED === 'true',
    [FeatureFlag.IsN4w1BackupEnabled]: process.env.EXPO_PUBLIC_FF_IS_N4W1_BACKUP_ENABLED === 'true',
};

export const featureFlagsPersistedKeys: Array<keyof FeatureFlagsState> = [
    FeatureFlag.AreDebugOnlyNetworksEnabled,
    FeatureFlag.AreExperimentalOnlyNetworksEnabled,
    FeatureFlag.IsCardanoSendEnabled,
    FeatureFlag.IsTradingDebugEnabled,
    FeatureFlag.IsN4w1BackupEnabled,
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

export const { toggleFeatureFlag } = featureFlagsSlice.actions;
export const featureFlagsReducer = featureFlagsSlice.reducer;
