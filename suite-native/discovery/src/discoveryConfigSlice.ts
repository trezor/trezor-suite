import { A, pipe } from '@mobily/ts-belt';
import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    AccountsRootState,
    DeviceRootState,
    filterUnavailableNetworks,
    selectDeviceSupportedNetworks,
} from '@suite-common/wallet-core';
import {
    filterTestnetNetworks,
    getNativeMainnetSymbols,
    getNativeTestnetSymbols,
    isDetoxTestBuild,
    sortNetworks,
} from '@suite-native/config';
import {
    FeatureFlag,
    FeatureFlagsRootState,
    selectIsFeatureFlagEnabled,
} from '@suite-native/feature-flags';
import {
    TokensRootState,
    isCoinWithTokens,
    selectNetworkSymbolsOfAccountsWithTokensAllowed,
} from '@suite-native/tokens';

type DiscoveryInfo = {
    startTimestamp: number;
    networkSymbols: NetworkSymbol[];
};

export type DiscoveryConfigState = {
    areTestnetsEnabled: boolean;
    discoveryInfo: DiscoveryInfo | null;
    isCoinEnablingInitFinished: boolean;
    enabledDiscoveryNetworkSymbols: NetworkSymbol[];
};

export type DiscoveryConfigSliceRootState = {
    discoveryConfig: DiscoveryConfigState;
} & AccountsRootState &
    DeviceRootState &
    TokensRootState;

const discoveryConfigInitialState: DiscoveryConfigState = {
    areTestnetsEnabled: isDetoxTestBuild(),
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
        addEnabledDiscoveryNetworkSymbol: (state, { payload }: PayloadAction<NetworkSymbol>) => {
            if (!state.enabledDiscoveryNetworkSymbols.includes(payload)) {
                state.enabledDiscoveryNetworkSymbols.push(payload);
            }
        },
        toggleEnabledDiscoveryNetworkSymbol: (state, { payload }: PayloadAction<NetworkSymbol>) => {
            const symbol = payload;
            const index = state.enabledDiscoveryNetworkSymbols.indexOf(symbol);

            if (index !== -1) {
                // If the network is already in the list, remove it
                state.enabledDiscoveryNetworkSymbols.splice(index, 1);
            } else {
                // If the network is not in the list, add it
                state.enabledDiscoveryNetworkSymbols.push(symbol);
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

export const selectIsCoinEnablingInitFinished = (
    state: DiscoveryConfigSliceRootState & FeatureFlagsRootState,
) => state.discoveryConfig.isCoinEnablingInitFinished;

// this includes all networks, including those that are not supported by current device
export const selectEnabledDiscoveryNetworkSymbols = (state: DiscoveryConfigSliceRootState) =>
    state.discoveryConfig.enabledDiscoveryNetworkSymbols;

// this includes only networks supported by current device
export const selectDeviceEnabledDiscoveryNetworkSymbols = createMemoizedSelector(
    [selectDiscoveryNetworkSymbols, selectEnabledDiscoveryNetworkSymbols],
    (networkSymbols, enabledSymbols) =>
        returnStableArrayIfEmpty(networkSymbols.filter(s => enabledSymbols.includes(s))),
);

export const selectTokenDefinitionsEnabledNetworks = createMemoizedSelector(
    [selectEnabledDiscoveryNetworkSymbols, selectNetworkSymbolsOfAccountsWithTokensAllowed],
    (enabledNetworkSymbols, accountNetworkSymbols) =>
        returnStableArrayIfEmpty(
            pipe(
                [...enabledNetworkSymbols, ...accountNetworkSymbols],
                A.filter(s => isCoinWithTokens(s)),
                A.uniq,
            ),
        ),
);

export const {
    toggleAreTestnetsEnabled,
    setDiscoveryInfo,
    addEnabledDiscoveryNetworkSymbol,
    toggleEnabledDiscoveryNetworkSymbol,
    setEnabledDiscoveryNetworkSymbols,
    setIsCoinEnablingInitFinished,
} = discoveryConfigSlice.actions;
export const discoveryConfigReducer = discoveryConfigSlice.reducer;
