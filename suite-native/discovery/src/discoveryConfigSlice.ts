import { A, pipe } from '@mobily/ts-belt';
import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import { TrezorDevice } from '@suite-common/suite-types';
import { type Network, type NetworkSymbol, getNetworkType, networksCollection } from '@suite-common/wallet-config';
import {
    AccountsRootState,
    DeviceRootState,
    WalletSettingsRootState,
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
import { getFirmwareVersion } from '@trezor/device-utils';
import { versionUtils } from '@trezor/utils';

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

/**
 * Filter collection of activated networks to only include those supported by device & suite
 */
const filterUnavailableNetworks = (
    enabledNetworks: NetworkSymbol[],
    device?: TrezorDevice,
): Network[] =>
    networksCollection.filter(n => {
        const firmwareVersion = getFirmwareVersion(device);
        const internalModel = device?.features?.internal_model;

        const isSupportedInSuite =
            !n.support || // support is not defined => is supported
            !internalModel || // typescript. device undefined. => supported
            (n.support[internalModel] && // support is defined for current device
                versionUtils.isNewerOrEqual(firmwareVersion, n.support[internalModel] as string)); // device version is newer or equal to support field in networks => supported

        return (
            enabledNetworks.includes(n.symbol) &&
            !n.isHidden &&
            !device?.unavailableCapabilities?.[n.symbol] && // exclude by network symbol (ex: xrp on T1B1)
            isSupportedInSuite
        );
    });

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
        state => selectIsFeatureFlagEnabled(state, FeatureFlag.IsStellarSupportEnabled),
    ],
    (
        deviceNetworks,
        defaultAreTestnetsEnabled,
        forcedAreTestnetsEnabled,
        isStellarSupportEnabled,
    ) => {
        const areTestnetsEnabled = forcedAreTestnetsEnabled ?? defaultAreTestnetsEnabled;

        return pipe(
            deviceNetworks,
            networkSymbols => filterTestnetNetworks(networkSymbols, areTestnetsEnabled),
            networkSymbols =>
                networkSymbols.filter(
                    symbol => isStellarSupportEnabled || getNetworkType(symbol) !== 'stellar',
                ),
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
