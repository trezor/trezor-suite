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

import { getNetworkSymbols } from './utils';

type DiscoveryInfo = {
    startTimestamp: number;
    networkSymbols: NetworkSymbol[];
};

type DiscoveryConfigState = {
    areTestnetsEnabled: boolean;
    discoveryInfo: DiscoveryInfo | null;
    enabledDiscoveryNetworkSymbols: NetworkSymbol[];
};

export type DiscoveryConfigSliceRootState = {
    discoveryConfig: DiscoveryConfigState;
};

const discoveryConfigInitialState: DiscoveryConfigState = {
    areTestnetsEnabled: false,
    discoveryInfo: null,
    enabledDiscoveryNetworkSymbols: [],
};

export const discoveryConfigPersistWhitelist: Array<keyof DiscoveryConfigState> = [
    'areTestnetsEnabled',
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
        toggleEnabledDiscoveryNetworkSymbols: (
            state,
            { payload }: PayloadAction<NetworkSymbol>,
        ) => {
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
    },
});

export const selectDiscoverySupportedNetworks = memoizeWithArgs(
    (state: DeviceRootState, areTestnetsEnabled: boolean) =>
        pipe(
            selectDeviceSupportedNetworks(state),
            networkSymbols => filterTestnetNetworks(networkSymbols, areTestnetsEnabled),
            filterUnavailableNetworks,
            filterBlacklistedNetworks,
            sortNetworks,
        ),
    // for all areTestnetsEnabled states
    { size: 2 },
);

export const selectAreTestnetsEnabled = (state: DiscoveryConfigSliceRootState) =>
    state.discoveryConfig.areTestnetsEnabled;

export const selectDiscoveryInfo = (state: DiscoveryConfigSliceRootState) =>
    state.discoveryConfig.discoveryInfo;

export const selectEnabledDiscoveryNetworkSymbols = memoizeWithArgs(
    (
        state: DiscoveryConfigSliceRootState & DeviceRootState & FeatureFlagsRootState,
        areTestnetsEnabled: boolean,
    ) => {
        const supportedNetworks = selectDiscoverySupportedNetworks(state, areTestnetsEnabled);
        const isCoinEnablingActive = selectIsFeatureFlagEnabled(
            state,
            FeatureFlag.IsCoinEnablingActive,
        );

        return getNetworkSymbols(
            supportedNetworks.filter(n =>
                isCoinEnablingActive
                    ? state.discoveryConfig.enabledDiscoveryNetworkSymbols.includes(n.symbol)
                    : true,
            ),
        );
    },
);

export const { toggleAreTestnetsEnabled, setDiscoveryInfo, toggleEnabledDiscoveryNetworkSymbols } =
    discoveryConfigSlice.actions;
export const discoveryConfigReducer = discoveryConfigSlice.reducer;
