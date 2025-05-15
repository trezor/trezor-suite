import { A, pipe } from '@mobily/ts-belt';
import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    AccountsRootState,
    DeviceRootState,
    WalletSettingsRootState,
    filterUnavailableNetworks,
    selectDeviceSupportedNetworks,
    selectEnabledNetworks,
} from '@suite-common/wallet-core';
import {
    filterTestnetNetworks,
    getNativeMainnetSymbols,
    getNativeTestnetSymbols,
    sortNetworks,
} from '@suite-native/config';
import {
    FeatureFlag,
    FeatureFlagsRootState,
    selectIsFeatureFlagEnabled,
} from '@suite-native/feature-flags';
import { SettingsSliceRootState, selectAreTestnetsEnabled } from '@suite-native/settings';
import {
    isCoinWithTokens,
    selectNetworkSymbolsOfAccountsWithTokensAllowed,
} from '@suite-native/tokens';

type DiscoveryInfo = {
    startTimestamp: number;
    networkSymbols: NetworkSymbol[];
};

export type DiscoveryConfigState = {
    discoveryInfo: DiscoveryInfo | null;
};

export type DiscoveryConfigSliceRootState = {
    discoveryConfig: DiscoveryConfigState;
} & AccountsRootState &
    DeviceRootState &
    WalletSettingsRootState &
    SettingsSliceRootState;

const discoveryConfigInitialState: DiscoveryConfigState = {
    discoveryInfo: null,
};

export const discoveryConfigSlice = createSlice({
    name: 'discoveryConfig',
    initialState: discoveryConfigInitialState,
    reducers: {
        setDiscoveryInfo: (state, { payload }: PayloadAction<DiscoveryInfo | null>) => {
            state.discoveryInfo = payload;
        },
    },
});

export const selectDiscoveryInfo = (state: DiscoveryConfigSliceRootState) =>
    state.discoveryConfig.discoveryInfo;

const createMemoizedSelector = createWeakMapSelector.withTypes<
    DeviceRootState & DiscoveryConfigSliceRootState & FeatureFlagsRootState
>();

export const selectDiscoverySupportedNetworks = createMemoizedSelector(
    [
        selectDeviceSupportedNetworks,
        selectAreTestnetsEnabled,
        (_state, forcedAreTestnetsEnabled?: boolean) => forcedAreTestnetsEnabled,
    ],
    (deviceNetworks, defaultAreTestnetsEnabled, forcedAreTestnetsEnabled) => {
        const areTestnetsEnabled = forcedAreTestnetsEnabled ?? defaultAreTestnetsEnabled;

        return pipe(
            deviceNetworks,
            networkSymbols => filterTestnetNetworks(networkSymbols, areTestnetsEnabled),
            filterUnavailableNetworks,
            sortNetworks,
            returnStableArrayIfEmpty,
        );
    },
);

export const selectDiscoveryNetworkSymbols = createMemoizedSelector(
    [
        selectDiscoverySupportedNetworks,
        (_state, forcedAreTestnetsEnabled?: boolean) => forcedAreTestnetsEnabled,
    ],
    supportedNetworks => returnStableArrayIfEmpty(supportedNetworks.map(n => n.symbol)),
);

export const selectSupportedTestnetNetworkSymbols = createMemoizedSelector(
    [state => selectIsFeatureFlagEnabled(state, FeatureFlag.IsRegtestEnabled)],
    isRegtestEnabled =>
        returnStableArrayIfEmpty(
            isRegtestEnabled
                ? [...getNativeTestnetSymbols(), 'regtest' as const]
                : getNativeTestnetSymbols(),
        ),
);

export const selectSupportedNetworkSymbols = createMemoizedSelector(
    [selectSupportedTestnetNetworkSymbols],
    testnets => returnStableArrayIfEmpty([...getNativeMainnetSymbols(), ...testnets]),
);

// this includes only networks supported by current device
export const selectDeviceEnabledDiscoveryNetworkSymbols = createMemoizedSelector(
    [selectDiscoveryNetworkSymbols, selectEnabledNetworks],
    (networkSymbols, enabledSymbols) =>
        returnStableArrayIfEmpty(networkSymbols.filter(s => enabledSymbols.includes(s))),
);

export const selectTokenDefinitionsEnabledNetworks = createMemoizedSelector(
    [selectEnabledNetworks, selectNetworkSymbolsOfAccountsWithTokensAllowed],
    (enabledNetworkSymbols, accountNetworkSymbols) =>
        returnStableArrayIfEmpty(
            pipe(
                [...enabledNetworkSymbols, ...accountNetworkSymbols],
                A.filter(s => isCoinWithTokens(s)),
                A.uniq,
            ),
        ),
);

export const { setDiscoveryInfo } = discoveryConfigSlice.actions;
export const discoveryConfigReducer = discoveryConfigSlice.reducer;
