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

type DiscoveryConfigState = {
    areTestnetsEnabled: boolean;
    discoveryStartTimeStamp: number | null;
    enabledDiscoveryNetworkSymbols: NetworkSymbol[];
};

type DiscoveryConfigSliceRootState = {
    discoveryConfig: DiscoveryConfigState;
};

const discoveryConfigInitialState: DiscoveryConfigState = {
    areTestnetsEnabled: false,
    discoveryStartTimeStamp: null,
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
        setDiscoveryStartTimestamp: (state, { payload }: PayloadAction<number | null>) => {
            state.discoveryStartTimeStamp = payload;
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

export const selectAreTestnetsEnabled = (state: DiscoveryConfigSliceRootState) =>
    state.discoveryConfig.areTestnetsEnabled;
export const selectDiscoveryStartTimeStamp = (state: DiscoveryConfigSliceRootState) =>
    state.discoveryConfig.discoveryStartTimeStamp;
export const selectEnabledDiscoveryNetworkSymbols = (state: DiscoveryConfigSliceRootState) =>
    state.discoveryConfig.enabledDiscoveryNetworkSymbols;

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

export const {
    toggleAreTestnetsEnabled,
    setDiscoveryStartTimestamp,
    toggleEnabledDiscoveryNetworkSymbols,
} = discoveryConfigSlice.actions;
export const discoveryConfigReducer = discoveryConfigSlice.reducer;
