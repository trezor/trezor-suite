import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { isIOs } from '@trezor/env-utils';

export const FeatureFlag = {
    AreDebugOnlyNetworksEnabled: 'areDebugOnlyNetworksEnabled',
    AreExperimentalOnlyNetworksEnabled: 'areExperimentalOnlyNetworksEnabled',
    IsCardanoSendEnabled: 'isCardanoSendEnabled',
    IsDebugKeysAllowed: 'isDebugKeysAllowed',
    IsTradingBuyEnabled: 'isTradingBuyEnabled',
    IsTradingExchangeEnabled: 'isTradingExchangeEnabled',
    IsTradingSellEnabled: 'isTradingSellEnabled',
    IsTradingConciergeEnabled: 'isTradingConciergeEnabled',
    AreTradingExchangeDexesEnabled: 'areTradingExchangeDexesEnabled',
    IsTradingResidenceCheckEnabled: 'isTradingResidenceCheckEnabled',
    IsTradingDebugEnabled: 'isTradingDebugEnabled',
    IsStablecoinYieldEnabled: 'isStablecoinYieldEnabled',
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
    [FeatureFlag.IsTradingBuyEnabled]: process.env.EXPO_PUBLIC_FF_IS_TRADING_BUY_ENABLED === 'true',
    [FeatureFlag.IsTradingExchangeEnabled]:
        process.env.EXPO_PUBLIC_FF_IS_TRADING_SWAP_ENABLED === 'true',
    [FeatureFlag.IsTradingSellEnabled]:
        process.env.EXPO_PUBLIC_FF_IS_TRADING_SELL_ENABLED === 'true',
    [FeatureFlag.IsTradingConciergeEnabled]:
        process.env.EXPO_PUBLIC_FF_IS_TRADING_CONCIERGE_ENABLED === 'true',
    [FeatureFlag.AreTradingExchangeDexesEnabled]:
        process.env.EXPO_PUBLIC_FF_ARE_TRADING_EXCHANGE_DEXES_ENABLED === 'true',
    [FeatureFlag.IsTradingResidenceCheckEnabled]:
        process.env.EXPO_PUBLIC_FF_IS_TRADING_RESIDENCE_CHECK_ENABLED === 'true' ||
        (isIOs() && process.env.EXPO_PUBLIC_FF_IS_TRADING_RESIDENCE_CHECK_ENABLED !== 'false'),
    [FeatureFlag.IsTradingDebugEnabled]:
        process.env.EXPO_PUBLIC_FF_IS_TRADING_DEBUG_ENABLED === 'true',
    [FeatureFlag.IsStablecoinYieldEnabled]:
        process.env.EXPO_PUBLIC_FF_IS_STABLECOIN_YIELD_DEBUG_ENABLED === 'true',
    [FeatureFlag.IsN4w1BackupEnabled]: process.env.EXPO_PUBLIC_FF_IS_N4W1_BACKUP_ENABLED === 'true',
};

export const featureFlagsPersistedKeys: Array<keyof FeatureFlagsState> = [
    FeatureFlag.AreDebugOnlyNetworksEnabled,
    FeatureFlag.AreExperimentalOnlyNetworksEnabled,
    FeatureFlag.IsCardanoSendEnabled,
    FeatureFlag.IsTradingBuyEnabled,
    FeatureFlag.IsTradingExchangeEnabled,
    FeatureFlag.IsTradingSellEnabled,
    FeatureFlag.IsTradingConciergeEnabled,
    FeatureFlag.AreTradingExchangeDexesEnabled,
    FeatureFlag.IsTradingResidenceCheckEnabled,
    FeatureFlag.IsTradingDebugEnabled,
    FeatureFlag.IsStablecoinYieldEnabled,
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
