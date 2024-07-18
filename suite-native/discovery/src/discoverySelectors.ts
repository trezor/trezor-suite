import { pipe, A, D } from '@mobily/ts-belt';

import {
    TokenDefinitionsRootState,
    selectValidTokensByDeviceStateAndNetworkSymbol,
} from '@suite-common/token-definitions';
import { NetworkSymbol } from '@suite-common/wallet-config';
import {
    DeviceRootState,
    DiscoveryRootState,
    selectDeviceAuthFailed,
    selectDeviceDiscovery,
    selectDeviceFirmwareVersion,
    selectDeviceModel,
    selectDeviceState,
    selectHasDeviceAuthConfirm,
    selectIsDeviceConnectedAndAuthorized,
    selectIsDeviceInViewOnlyMode,
    selectIsDeviceUnlocked,
    selectIsPortfolioTrackerDevice,
} from '@suite-common/wallet-core';
import { LIMIT as ACCOUNTS_LIMIT } from '@suite-common/wallet-core';
import {
    AccountsRootState,
    selectAccountsByDeviceStateAndNetworkSymbol,
    selectDeviceAccounts,
} from '@suite-common/wallet-core';
import { TokenSymbol, TokenAddress } from '@suite-common/wallet-types';
import { isFirmwareVersionSupported } from '@suite-native/device';
import { FeatureFlagsRootState } from '@suite-native/feature-flags';

import {
    DiscoveryConfigSliceRootState,
    selectAreTestnetsEnabled,
    selectDiscoverySupportedNetworks,
    selectEnabledDiscoveryNetworkSymbols,
} from './discoveryConfigSlice';
import { getNetworksWithUnfinishedDiscovery } from './utils';

export const selectDiscoveryAccountsAnalytics = (
    state: AccountsRootState & DeviceRootState & TokenDefinitionsRootState,
    deviceState: string,
) =>
    pipe(
        selectDeviceAccounts(state),
        A.groupBy(account => account.symbol),
        D.mapWithKey((networkSymbol, accounts) => {
            const numberOfAccounts = accounts?.length ?? 0;

            const accountsByDeviceStateAndNetworkSymbol =
                selectAccountsByDeviceStateAndNetworkSymbol(state, deviceState, networkSymbol);

            const validTokens = selectValidTokensByDeviceStateAndNetworkSymbol(
                state,
                accountsByDeviceStateAndNetworkSymbol,
                networkSymbol as NetworkSymbol,
            );

            if (A.isNotEmpty(validTokens)) {
                return {
                    numberOfAccounts,
                    tokenSymbols: validTokens.map(token => token.symbol as TokenSymbol),
                    tokenAddresses: validTokens.map(token => token.contract as TokenAddress),
                };
            }

            return {
                numberOfAccounts,
            };
        }),
    );

export const selectNetworksWithUnfinishedDiscovery = (
    state: DeviceRootState &
        AccountsRootState &
        FeatureFlagsRootState &
        DiscoveryConfigSliceRootState,
    areTestnetsEnabled: boolean,
) => {
    const enabledNetworkSymbols = selectEnabledDiscoveryNetworkSymbols(state, areTestnetsEnabled);
    const accounts = selectDeviceAccounts(state);
    const supportedNetworks = selectDiscoverySupportedNetworks(state, areTestnetsEnabled);

    const enabledNetworks = supportedNetworks.filter(n => enabledNetworkSymbols.includes(n.symbol));

    return getNetworksWithUnfinishedDiscovery(enabledNetworks, accounts, ACCOUNTS_LIMIT);
};

//we should run discovery when there are network symbols with unfinished discovery
export const selectShouldRunDiscoveryForDevice = (
    state: DeviceRootState &
        AccountsRootState &
        FeatureFlagsRootState &
        DiscoveryConfigSliceRootState,
) => {
    // no discovery for PortfolioTracker ever
    const isPortfolioTrackerDevice = selectIsPortfolioTrackerDevice(state);
    if (isPortfolioTrackerDevice) {
        return false;
    }

    const areTestnetsEnabled = selectAreTestnetsEnabled(state);
    const networksWithUnfinishedDiscovery = selectNetworksWithUnfinishedDiscovery(
        state,
        areTestnetsEnabled,
    );

    return networksWithUnfinishedDiscovery.length > 0;
};

// we do not run discovery for unsupported device (e.g. old firmware, portfolio device, unauthorized), when discovery is already running or when device is in view-only mode
export const selectCanRunDiscoveryForDevice = (
    state: DeviceRootState &
        AccountsRootState &
        DiscoveryRootState &
        FeatureFlagsRootState &
        DiscoveryConfigSliceRootState,
) => {
    const deviceState = selectDeviceState(state);
    if (!deviceState) {
        return false;
    }

    const discovery = selectDeviceDiscovery(state);
    const deviceModel = selectDeviceModel(state);
    const deviceFwVersion = selectDeviceFirmwareVersion(state);
    const isDeviceConnectedAndAuthorized = selectIsDeviceConnectedAndAuthorized(state);
    const isPortfolioTrackerDevice = selectIsPortfolioTrackerDevice(state);

    const isDeviceFirmwareVersionSupported = isFirmwareVersionSupported(
        deviceFwVersion,
        deviceModel,
    );

    const isDeviceInViewOnlyMode = selectIsDeviceInViewOnlyMode(state);
    const isDeviceUnlocked = selectIsDeviceUnlocked(state);
    const hasDeviceAuthConfirm = selectHasDeviceAuthConfirm(state);
    const hasDeviceAuthFailed = selectDeviceAuthFailed(state);

    const canRunDiscovery =
        !discovery &&
        isDeviceConnectedAndAuthorized &&
        !isPortfolioTrackerDevice &&
        !isDeviceInViewOnlyMode &&
        isDeviceUnlocked &&
        !hasDeviceAuthConfirm &&
        !hasDeviceAuthFailed &&
        isDeviceFirmwareVersionSupported;

    return canRunDiscovery;
};
