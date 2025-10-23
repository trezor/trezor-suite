import { PayloadAction, createSlice } from '@reduxjs/toolkit';

export const FeatureFlag = {
    IsBluetoothEnabled: 'isBluetoothEnabled',
    AreDebugOnlyNetworksEnabled: 'areDebugOnlyNetworksEnabled',
    IsCardanoSendEnabled: 'isCardanoSendEnabled',
    IsDebugKeysAllowed: 'isDebugKeysAllowed',
    IsTradingBuyEnabled: 'isTradingBuyEnabled',
    IsTradingExchangeEnabled: 'isTradingExchangeEnabled',
    IsTradingSellEnabled: 'isTradingSellEnabled',
    AreTradingExchangeDexesEnabled: 'areTradingExchangeDexesEnabled',
    IsLocalizationEnabled: 'isLocalizationEnabled',
    IsLocalFirstStorageEnabled: 'isLocalFirstStorageEnabled',
} as const;

export type FeatureFlag = (typeof FeatureFlag)[keyof typeof FeatureFlag];

export type FeatureFlagsState = Record<FeatureFlag, boolean>;

export type FeatureFlagsRootState = {
    featureFlags: FeatureFlagsState;
};

export const featureFlagsInitialState: FeatureFlagsState = {
    [FeatureFlag.IsBluetoothEnabled]: process.env.EXPO_PUBLIC_FF_IS_BLUETOOTH_ENABLED !== 'false',
    [FeatureFlag.AreDebugOnlyNetworksEnabled]:
        process.env.EXPO_PUBLIC_FF_ARE_DEBUG_ONLY_NETWORKS_ENABLED === 'true',
    [FeatureFlag.IsCardanoSendEnabled]:
        process.env.EXPO_PUBLIC_FF_IS_CARDANO_SEND_ENABLED === 'true',
    [FeatureFlag.IsDebugKeysAllowed]: process.env.EXPO_PUBLIC_FF_IS_DEBUG_KEYS_ALLOWED === 'true',
    [FeatureFlag.IsTradingBuyEnabled]: process.env.EXPO_PUBLIC_FF_IS_TRADING_BUY_ENABLED === 'true',
    [FeatureFlag.IsTradingExchangeEnabled]:
        process.env.EXPO_PUBLIC_FF_IS_TRADING_SWAP_ENABLED === 'true',
    [FeatureFlag.IsTradingSellEnabled]:
        process.env.EXPO_PUBLIC_FF_IS_TRADING_SELL_ENABLED === 'true',
    [FeatureFlag.AreTradingExchangeDexesEnabled]:
        process.env.EXPO_PUBLIC_FF_ARE_TRADING_EXCHANGE_DEXES_ENABLED === 'true',
    [FeatureFlag.IsLocalizationEnabled]:
        process.env.EXPO_PUBLIC_FF_IS_LOCALIZATION_ENABLED === 'true',
    [FeatureFlag.IsLocalFirstStorageEnabled]:
        process.env.EXPO_PUBLIC_FF_IS_LOCAL_FIRST_STORAGE_ENABLED === 'true',
};

export const featureFlagsPersistedKeys: Array<keyof FeatureFlagsState> = [
    FeatureFlag.IsBluetoothEnabled,
    FeatureFlag.AreDebugOnlyNetworksEnabled,
    FeatureFlag.IsCardanoSendEnabled,
    FeatureFlag.IsTradingBuyEnabled,
    FeatureFlag.IsTradingExchangeEnabled,
    FeatureFlag.IsTradingSellEnabled,
    FeatureFlag.AreTradingExchangeDexesEnabled,
    FeatureFlag.IsLocalFirstStorageEnabled,
    FeatureFlag.IsLocalizationEnabled,
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
