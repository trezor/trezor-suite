import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { pipe } from '@mobily/ts-belt';
import { memoizeWithArgs } from 'proxy-memoize';

import {
    DeviceRootState,
    filterUnavailableNetworks,
    selectDeviceSupportedNetworks,
} from '@suite-common/wallet-core';
import {
    filterBlacklistedNetworks,
    filterTestnetNetworks,
    sortNetworks,
} from '@suite-native/config';
import { NetworkSymbol } from '@suite-common/wallet-config';
import {
    FeatureFlag,
    FeatureFlagsRootState,
    selectIsFeatureFlagEnabled,
} from '@suite-native/feature-flags';

type DiscoveryInfo = {
    startTimestamp: number;
    networkSymbols: NetworkSymbol[];
};

type DiscoveryConfigState = {
    areTestnetsEnabled: boolean;
    discoveryInfo: DiscoveryInfo | null;
    isCoinEnablingInitFinished: boolean;
    enabledDiscoveryNetworkSymbols: NetworkSymbol[];
};

export type DiscoveryConfigSliceRootState = {
    discoveryConfig: DiscoveryConfigState;
};

const discoveryConfigInitialState: DiscoveryConfigState = {
    areTestnetsEnabled: false,
    discoveryInfo: null,
    isCoinEnablingInitFinished: false,
    enabledDiscoveryNetworkSymbols: [],
};

export const discoveryConfigPersistWhitelist: Array<keyof DiscoveryConfigState> = [
    'areTestnetsEnabled',
    'isCoinEnablingInitFinished',
    'enabledDiscoveryNetworkSymbols',
];

export const discoveryConfigSlice = createSlice({
    name: 'discoveryConfig',
    initialState: discoveryConfigInitialState,
    reducers: {
        toggleAreTestnetsEnabled: state => {
            state.areTestnetsEnabled = !state.areTestnetsEnabled;
        },
        setDiscoveryInfo: (state, { payload }: PayloadAction<DiscoveryInfo | null>) => {
            state.discoveryInfo = payload;
        },
        toggleEnabledDiscoveryNetworkSymbol: (state, { payload }: PayloadAction<NetworkSymbol>) => {
            const networkSymbol = payload;
            const index = state.enabledDiscoveryNetworkSymbols.indexOf(networkSymbol);

            if (index !== -1) {
                // If the network is already in the list, remove it
                state.enabledDiscoveryNetworkSymbols.splice(index, 1);
            } else {
                // If the network is not in the list, add it
                state.enabledDiscoveryNetworkSymbols.push(networkSymbol);
            }
        },
        setEnabledDiscoveryNetworkSymbols: (state, { payload }: PayloadAction<NetworkSymbol[]>) => {
            state.enabledDiscoveryNetworkSymbols = payload;
        },
        setIsCoinEnablingInitFinished: (state, { payload }: PayloadAction<boolean>) => {
            state.isCoinEnablingInitFinished = payload;
        },
    },
});

export const selectAreTestnetsEnabled = (state: DiscoveryConfigSliceRootState) =>
    state.discoveryConfig.areTestnetsEnabled;

export const selectDiscoveryInfo = (state: DiscoveryConfigSliceRootState) =>
    state.discoveryConfig.discoveryInfo;

export const selectDiscoverySupportedNetworks = memoizeWithArgs(
    (
        state: DeviceRootState & DiscoveryConfigSliceRootState & FeatureFlagsRootState,
        forcedAreTestnetsEnabled?: boolean,
    ) => {
        const areTestnetsEnabled = forcedAreTestnetsEnabled ?? selectAreTestnetsEnabled(state);
        const isPolygonEnabled = selectIsFeatureFlagEnabled(state, FeatureFlag.IsPolygonEnabled);
        const isBscEnabled = selectIsFeatureFlagEnabled(state, FeatureFlag.IsBscEnabled);

        const allowlist: NetworkSymbol[] = [];

        if (isPolygonEnabled) {
            allowlist.push('matic');
        }
        if (isBscEnabled) {
            allowlist.push('bnb');
        }

        return pipe(
            selectDeviceSupportedNetworks(state),
            networkSymbols => filterTestnetNetworks(networkSymbols, areTestnetsEnabled),
            filterUnavailableNetworks,
            availableNetworks => filterBlacklistedNetworks(availableNetworks, allowlist),
            sortNetworks,
        );
    },
    // for all areTestnetsEnabled states
    { size: 2 },
);

export const selectDiscoveryNetworkSymbols = memoizeWithArgs(
    (
        state: DeviceRootState & DiscoveryConfigSliceRootState & FeatureFlagsRootState,
        forcedAreTestnetsEnabled?: boolean,
    ) => {
        const supportedNetworks = selectDiscoverySupportedNetworks(state, forcedAreTestnetsEnabled);

        return supportedNetworks.map(n => n.symbol);
    },
    { size: 2 },
);

export const selectIsCoinEnablingInitFinished = (
    state: DiscoveryConfigSliceRootState & FeatureFlagsRootState,
) => state.discoveryConfig.isCoinEnablingInitFinished;

// this includes all networks, including those that are not supported by current device
export const selectEnabledDiscoveryNetworkSymbols = (state: DiscoveryConfigSliceRootState) =>
    state.discoveryConfig.enabledDiscoveryNetworkSymbols;

// this includes only networks supported by current device
export const selectDeviceEnabledDiscoveryNetworkSymbols = memoizeWithArgs(
    (
        state: DiscoveryConfigSliceRootState & DeviceRootState & FeatureFlagsRootState,
        forcedAreTestnetsEnabled?: boolean,
    ) =>
        selectDiscoveryNetworkSymbols(state, forcedAreTestnetsEnabled).filter(s =>
            state.discoveryConfig.enabledDiscoveryNetworkSymbols.includes(s),
        ),
    { size: 2 },
);

export const {
    toggleAreTestnetsEnabled,
    setDiscoveryInfo,
    toggleEnabledDiscoveryNetworkSymbol,
    setEnabledDiscoveryNetworkSymbols,
    setIsCoinEnablingInitFinished,
} = discoveryConfigSlice.actions;
export const discoveryConfigReducer = discoveryConfigSlice.reducer;
