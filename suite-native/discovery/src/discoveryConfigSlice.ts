import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { A, F, pipe } from '@mobily/ts-belt';

import {
    AccountsRootState,
    DeviceRootState,
    filterUnavailableNetworks,
    selectDeviceSupportedNetworks,
} from '@suite-common/wallet-core';
import {
    filterBlacklistedNetworks,
    filterTestnetNetworks,
    isDetoxTestBuild,
    portfolioTrackerMainnets,
    portfolioTrackerTestnets,
    sortNetworks,
} from '@suite-native/config';
import { NetworkSymbol } from '@suite-common/wallet-config';
import {
    createSelectIsFeatureFlagEnabled,
    FeatureFlag,
    FeatureFlagsRootState,
    selectIsFeatureFlagEnabled,
} from '@suite-native/feature-flags';
import {
    selectNetworkSymbolsOfAccountsWithTokensAllowed,
    TokensRootState,
} from '@suite-native/tokens';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';

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

const createMemoizedSelector = createWeakMapSelector.withTypes<
    DeviceRootState & DiscoveryConfigSliceRootState & FeatureFlagsRootState
>();

const selectIsSolanaEnabled = createSelectIsFeatureFlagEnabled(FeatureFlag.IsSolanaEnabled);

export const selectFeatureFlagEnabledNetworkSymbols = createMemoizedSelector(
    [selectIsSolanaEnabled, selectAreTestnetsEnabled],
    (isSolanaEnabled, areTestnetsEnabled) => {
        const allowlist: NetworkSymbol[] = [];

        if (isSolanaEnabled) {
            allowlist.push('sol');
            if (areTestnetsEnabled) {
                allowlist.push('dsol');
            }
        }

        return returnStableArrayIfEmpty(allowlist);
    },
);

export const selectDiscoverySupportedNetworks = createMemoizedSelector(
    [
        selectDeviceSupportedNetworks,
        selectAreTestnetsEnabled,
        selectFeatureFlagEnabledNetworkSymbols,
        (_state, forcedAreTestnetsEnabled?: boolean) => forcedAreTestnetsEnabled,
    ],
    (deviceNetworks, defaultAreTestnetsEnabled, allowlist, forcedAreTestnetsEnabled) => {
        const areTestnetsEnabled = forcedAreTestnetsEnabled ?? defaultAreTestnetsEnabled;

        return pipe(
            deviceNetworks,
            networkSymbols => filterTestnetNetworks(networkSymbols, areTestnetsEnabled),
            filterUnavailableNetworks,
            availableNetworks => filterBlacklistedNetworks(availableNetworks, allowlist),
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

export const selectPortfolioTrackerMainnetNetworkSymbols = createMemoizedSelector(
    [selectFeatureFlagEnabledNetworkSymbols],
    allowlist => returnStableArrayIfEmpty([...portfolioTrackerMainnets, ...allowlist]),
);

export const selectPortfolioTrackerTestnetNetworkSymbols = createMemoizedSelector(
    [state => selectIsFeatureFlagEnabled(state, FeatureFlag.IsRegtestEnabled)],
    isRegtestEnabled =>
        returnStableArrayIfEmpty(
            isRegtestEnabled
                ? [...portfolioTrackerTestnets, 'regtest' as NetworkSymbol]
                : portfolioTrackerTestnets,
        ),
);

export const selectPortfolioTrackerNetworkSymbols = createMemoizedSelector(
    [selectPortfolioTrackerMainnetNetworkSymbols, selectPortfolioTrackerTestnetNetworkSymbols],
    (mainnets, testnets) => returnStableArrayIfEmpty([...mainnets, ...testnets]),
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
            F.toMutable(A.uniq([...enabledNetworkSymbols, ...accountNetworkSymbols])),
        ),
);

export const {
    toggleAreTestnetsEnabled,
    setDiscoveryInfo,
    toggleEnabledDiscoveryNetworkSymbol,
    setEnabledDiscoveryNetworkSymbols,
    setIsCoinEnablingInitFinished,
} = discoveryConfigSlice.actions;
export const discoveryConfigReducer = discoveryConfigSlice.reducer;
