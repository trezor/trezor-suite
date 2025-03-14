import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { isAndroid } from '@trezor/env-utils';

export const FeatureFlag = {
    IsDeviceConnectEnabled: 'isDeviceConnectEnabled',
    IsCardanoSendEnabled: 'isCardanoSendEnabled',
    IsRegtestEnabled: 'isRegtestEnabled',
    IsConnectPopupEnabled: 'isConnectPopupEnabled',
    IsDeviceOnboardingEnabled: 'isDeviceOnboardingEnabled',
    IsTradingEnabled: 'isTradingEnabled',
    IsWalletConnectEnabled: 'isWalletConnectEnabled',
} as const;

export type FeatureFlag = (typeof FeatureFlag)[keyof typeof FeatureFlag];

export type FeatureFlagsState = Record<FeatureFlag, boolean>;

export type FeatureFlagsRootState = {
    featureFlags: FeatureFlagsState;
};

export const featureFlagsInitialState: FeatureFlagsState = {
    [FeatureFlag.IsDeviceConnectEnabled]:
        process.env.EXPO_PUBLIC_FF_IS_DEVICE_CONNECT_ENABLED === 'true' ||
        (isAndroid() && process.env.EXPO_PUBLIC_FF_IS_DEVICE_CONNECT_ENABLED !== 'false'),
    [FeatureFlag.IsCardanoSendEnabled]:
        process.env.EXPO_PUBLIC_FF_IS_CARDANO_SEND_ENABLED === 'true',
    [FeatureFlag.IsRegtestEnabled]: process.env.EXPO_PUBLIC_FF_IS_REGTEST_ENABLED === 'true',
    [FeatureFlag.IsConnectPopupEnabled]:
        process.env.EXPO_PUBLIC_FF_IS_CONNECT_POPUP_ENABLED === 'true',
    [FeatureFlag.IsDeviceOnboardingEnabled]:
        process.env.EXPO_PUBLIC_FF_IS_DEVICE_ONBOARDING_ENABLED === 'true',
    [FeatureFlag.IsTradingEnabled]: process.env.EXPO_PUBLIC_FF_IS_TRADING_ENABLED === 'true',
    [FeatureFlag.IsWalletConnectEnabled]:
        process.env.EXPO_PUBLIC_FF_IS_WALLET_CONNECT_ENABLED === 'true',
};

export const featureFlagsPersistedKeys: Array<keyof FeatureFlagsState> = [
    FeatureFlag.IsDeviceConnectEnabled,
    FeatureFlag.IsCardanoSendEnabled,
    FeatureFlag.IsRegtestEnabled,
    FeatureFlag.IsConnectPopupEnabled,
    FeatureFlag.IsDeviceOnboardingEnabled,
    FeatureFlag.IsTradingEnabled,
    FeatureFlag.IsWalletConnectEnabled,
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
