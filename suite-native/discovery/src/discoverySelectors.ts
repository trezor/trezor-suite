import { A, pipe } from '@mobily/ts-belt';

import type { DeviceRootState } from '@suite-common/device';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import { type TrezorDevice } from '@suite-common/suite-types';
import {
    type Network,
    type NetworkConfigDeps,
    type NetworkSymbol,
    filterNetworksByName,
    getMainnets,
    getNetworks,
    getTestnets,
} from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type WalletSettingsRootState,
    selectDeviceSupportedNetworks,
    selectEnabledNetworks,
} from '@suite-common/wallet-core';
import { filterTestnetNetworks, sortNetworks } from '@suite-native/config';
import {
    FeatureFlag,
    type FeatureFlagsRootState,
    selectIsFeatureFlagEnabled,
} from '@suite-native/feature-flags';
import { type SettingsSliceRootState, selectAreTestnetsEnabled } from '@suite-native/settings';
import {
    isNetworkWithTokens,
    selectNetworkSymbolsOfAccountsWithTokensAllowed,
} from '@suite-native/tokens';
import { getFirmwareVersion } from '@trezor/device-utils';
import { arrayPartition, versionUtils } from '@trezor/utils';

export type DiscoveryRootState = DeviceRootState &
    SettingsSliceRootState &
    AccountsRootState &
    WalletSettingsRootState &
    FeatureFlagsRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<DiscoveryRootState>();

/**
 * Filter collection of activated networks to only include those supported by device & suite
 */
const filterUnavailableNetworks = (
    deps: NetworkConfigDeps,
    enabledNetworks: NetworkSymbol[],
    device?: TrezorDevice,
): Network[] =>
    getNetworks(deps).filter(n => {
        const firmwareVersion = getFirmwareVersion(device);
        const internalModel = device?.features?.internal_model;

        const isSupportedInSuite =
            !n.support || // support is not defined => is supported
            !internalModel || // typescript. device undefined. => supported
            (n.support[internalModel] && // support is defined for current device
                versionUtils.isNewerOrEqual(firmwareVersion, n.support[internalModel])); // device version is newer or equal to support field in networks => supported

        return (
            enabledNetworks.includes(n.symbol) &&
            !n.isHidden &&
            !device?.unavailableCapabilities?.[n.symbol] && // exclude by network symbol (ex: xrp on T1B1)
            isSupportedInSuite
        );
    });

export const selectDiscoverySupportedNetworks = createMemoizedSelector(
    [
        selectDeviceSupportedNetworks,
        selectAreTestnetsEnabled,
        state => selectIsFeatureFlagEnabled(state, FeatureFlag.AreDebugOnlyNetworksEnabled),
        state => selectIsFeatureFlagEnabled(state, FeatureFlag.AreExperimentalOnlyNetworksEnabled),
        (_state, deps: NetworkConfigDeps) => deps,
    ],
    (
        deviceNetworks,
        areTestnetsEnabled,
        areDebugOnlyNetworksEnabled,
        areExperimentalOnlyNetworksEnabled,
        deps,
    ) =>
        pipe(
            deviceNetworks,
            networkSymbols => filterTestnetNetworks(deps, networkSymbols, areTestnetsEnabled),
            networkSymbols =>
                networkSymbols.filter(symbol => {
                    const network = deps.getNetworkConfig(symbol);

                    if (network.isDebugOnlyNetwork) {
                        return areDebugOnlyNetworksEnabled;
                    }

                    if (network.isExperimentalOnlyNetwork) {
                        return areExperimentalOnlyNetworksEnabled;
                    }

                    return true;
                }),
            networkSymbols => filterUnavailableNetworks(deps, networkSymbols),
            networks => sortNetworks(deps, networks),
            returnStableArrayIfEmpty,
        ),
);

export const selectDiscoveryNetworkSymbols = createMemoizedSelector(
    [
        (state, searchQuery: string = '', deps: NetworkConfigDeps) =>
            selectDiscoverySupportedNetworks(state, deps),
        (_state, searchQuery: string = '') => searchQuery,
    ],
    (supportedNetworks, searchQuery) =>
        returnStableArrayIfEmpty(
            filterNetworksByName(supportedNetworks, searchQuery).map(n => n.symbol),
        ),
);

// this includes only networks supported by current device
export const selectDeviceEnabledDiscoveryNetworkSymbols = createMemoizedSelector(
    [selectDiscoveryNetworkSymbols, selectEnabledNetworks],
    (networkSymbols, enabledSymbols) =>
        returnStableArrayIfEmpty(networkSymbols.filter(s => enabledSymbols.includes(s))),
);

export const selectTokenDefinitionsEnabledNetworks = createMemoizedSelector(
    [
        selectEnabledNetworks,
        selectNetworkSymbolsOfAccountsWithTokensAllowed,
        (_state, deps: NetworkConfigDeps) => deps,
    ],
    (enabledNetworkSymbols, accountNetworkSymbols, deps) =>
        returnStableArrayIfEmpty(
            pipe(
                [...enabledNetworkSymbols, ...accountNetworkSymbols],
                A.filter(s => isNetworkWithTokens(deps, s)),
                A.uniq,
            ),
        ),
);

export const selectDiscoveryNetworkGroups = createMemoizedSelector(
    [
        selectDeviceSupportedNetworks,
        state => selectIsFeatureFlagEnabled(state, FeatureFlag.AreDebugOnlyNetworksEnabled),
        state => selectIsFeatureFlagEnabled(state, FeatureFlag.AreExperimentalOnlyNetworksEnabled),
        selectAreTestnetsEnabled,
        (_state, searchQuery: string = '') => searchQuery,
        (_state, _searchQuery, deps: NetworkConfigDeps) => deps,
    ],
    (
        deviceSupportedNetworks,
        areDebugOnlyNetworksEnabled,
        areExperimentalOnlyNetworksEnabled,
        areTestnetsEnabled,
        searchQuery,
        deps,
    ) => {
        const mainnets = getMainnets({
            allNetworks: getNetworks(deps),
            debug: areDebugOnlyNetworksEnabled,
            useExperimentalNetworks: areExperimentalOnlyNetworksEnabled,
        });
        const testnets = getTestnets({
            allNetworks: getNetworks(deps),
            debug: areDebugOnlyNetworksEnabled,
            useExperimentalNetworks: areExperimentalOnlyNetworksEnabled,
            useTestnetNetworks: areTestnetsEnabled,
        });

        const isNetworkSupported = (network: Network) =>
            deviceSupportedNetworks.includes(network.symbol);
        const [supportedMainnets, unsupportedMainnets] = arrayPartition(
            filterNetworksByName(mainnets, searchQuery),
            isNetworkSupported,
        );
        const [supportedTestnets, unsupportedTestnets] = arrayPartition(
            filterNetworksByName(testnets, searchQuery),
            isNetworkSupported,
        );

        return {
            supportedMainnets,
            supportedTestnets,
            unsupportedMainnets,
            unsupportedTestnets,
        };
    },
);
