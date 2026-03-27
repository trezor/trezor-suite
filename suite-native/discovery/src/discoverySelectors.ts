import { A, pipe } from '@mobily/ts-belt';

import type { DeviceRootState } from '@suite-common/device';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import { type TrezorDevice } from '@suite-common/suite-types';
import {
    type Network,
    type NetworkSymbol,
    getNetwork,
    networksCollection,
} from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type WalletSettingsRootState,
    selectDeviceSupportedNetworks,
    selectEnabledNetworks,
} from '@suite-common/wallet-core';
import { isViewOnlySymbol } from '@suite-common/wallet-utils';
import { filterTestnetNetworks, sortNetworks } from '@suite-native/config';
import {
    FeatureFlag,
    type FeatureFlagsRootState,
    selectIsFeatureFlagEnabled,
} from '@suite-native/feature-flags';
import {
    type SettingsSliceRootState,
    selectAreTestnetsEnabled,
    selectIsTronEnabled,
} from '@suite-native/settings';
import {
    isNetworkWithTokens,
    selectNetworkSymbolsOfAccountsWithTokensAllowed,
} from '@suite-native/tokens';
import { getFirmwareVersion } from '@trezor/device-utils';
import { versionUtils } from '@trezor/utils';

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

const createMemoizedSelector = createWeakMapSelector.withTypes<
    DeviceRootState &
        SettingsSliceRootState &
        AccountsRootState &
        WalletSettingsRootState &
        FeatureFlagsRootState
>();

export const selectDiscoverySupportedNetworks = createMemoizedSelector(
    [
        selectDeviceSupportedNetworks,
        selectIsTronEnabled,
        selectAreTestnetsEnabled,
        (_state, forcedAreTestnetsEnabled?: boolean) => forcedAreTestnetsEnabled,
        state => selectIsFeatureFlagEnabled(state, FeatureFlag.AreDebugOnlyNetworksEnabled),
        state => selectIsFeatureFlagEnabled(state, FeatureFlag.AreExperimentalOnlyNetworksEnabled),
    ],
    (
        deviceNetworks,
        isTronEnabled,
        defaultAreTestnetsEnabled,
        forcedAreTestnetsEnabled,
        areDebugOnlyNetworksEnabled,
        areExperimentalOnlyNetworksEnabled,
    ) => {
        const areTestnetsEnabled = forcedAreTestnetsEnabled ?? defaultAreTestnetsEnabled;

        return pipe(
            deviceNetworks,
            networkSymbols =>
                networkSymbols.filter(symbol => isTronEnabled || !isViewOnlySymbol(symbol)),
            networkSymbols => filterTestnetNetworks(networkSymbols, areTestnetsEnabled),
            networkSymbols =>
                networkSymbols.filter(symbol => {
                    const network = getNetwork(symbol);

                    if (network.isDebugOnlyNetwork) {
                        return areDebugOnlyNetworksEnabled;
                    }

                    if (network.isExperimentalOnlyNetwork) {
                        return areExperimentalOnlyNetworksEnabled;
                    }

                    return true;
                }),
            filterUnavailableNetworks,
            sortNetworks,
            returnStableArrayIfEmpty,
        );
    },
);

export const selectDiscoveryNetworkSymbols = createMemoizedSelector(
    [selectDiscoverySupportedNetworks],
    supportedNetworks => returnStableArrayIfEmpty(supportedNetworks.map(n => n.symbol)),
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
                A.filter(s => isNetworkWithTokens(s)),
                A.uniq,
            ),
        ),
);
