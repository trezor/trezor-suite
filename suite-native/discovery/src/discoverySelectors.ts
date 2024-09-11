import { A, D, O, pipe, S } from '@mobily/ts-belt';

import {
    selectIsSpecificCoinDefinitionKnown,
    TokenDefinitionsRootState,
} from '@suite-common/token-definitions';
import { NetworkSymbol } from '@suite-common/wallet-config';
import {
    LIMIT as ACCOUNTS_LIMIT,
    AccountsRootState,
    DeviceRootState,
    DiscoveryRootState,
    selectAccountsByNetworkAndDeviceState,
    selectDeviceAccounts,
    selectDeviceAuthFailed,
    selectHasDeviceDiscovery,
    selectDeviceFirmwareVersion,
    selectDeviceModel,
    selectDeviceState,
    selectHasDeviceAuthConfirm,
    selectIsDeviceConnectedAndAuthorized,
    selectIsDeviceInViewOnlyMode,
    selectIsDeviceUnlocked,
    selectIsPortfolioTrackerDevice,
} from '@suite-common/wallet-core';
import { TokenAddress, TokenSymbol } from '@suite-common/wallet-types';
import { isFirmwareVersionSupported } from '@suite-native/device';
import { FeatureFlagsRootState } from '@suite-native/feature-flags';

import {
    DiscoveryConfigSliceRootState,
    selectDiscoverySupportedNetworks,
    selectEnabledDiscoveryNetworkSymbols,
    selectIsCoinEnablingInitFinished,
} from './discoveryConfigSlice';
import { getNetworksWithUnfinishedDiscovery } from './utils';

export const selectValidTokensByDeviceStateAndNetworkSymbol = (
    state: TokenDefinitionsRootState & DeviceRootState & AccountsRootState,
    deviceState: string,
    networkSymbol: NetworkSymbol,
) => {
    const accountsByDeviceStateAndNetworkSymbol = selectAccountsByNetworkAndDeviceState(
        state,
        deviceState,
        networkSymbol,
    );

    return pipe(
        accountsByDeviceStateAndNetworkSymbol,
        A.filter(account => account.symbol === networkSymbol),
        A.map(account => account.tokens),
        A.flat,

        A.filterMap(token => {
            if (token?.contract === undefined) {
                return O.None;
            }

            const tokenContract = token.contract as TokenAddress;
            const tokenSymbol = token.symbol as TokenSymbol;

            if (selectIsSpecificCoinDefinitionKnown(state, networkSymbol, tokenContract)) {
                return O.Some(`${tokenContract}:${tokenSymbol}`);
            }
        }),

        // Don't use A.uniq(By) because it's slow for large arrays
        t => Array.from(new Set<string>(t)),
        A.map(S.split(':')),
    ) as Array<[TokenAddress, TokenSymbol]>;
};

export const selectDiscoveryAccountsAnalytics = (
    state: AccountsRootState & DeviceRootState & TokenDefinitionsRootState,
    deviceState: string,
) =>
    pipe(
        selectDeviceAccounts(state),
        A.groupBy(account => account.symbol),
        D.mapWithKey((networkSymbol, accounts) => {
            const numberOfAccounts = accounts?.length ?? 0;

            const validTokens = selectValidTokensByDeviceStateAndNetworkSymbol(
                state,
                deviceState,
                networkSymbol as NetworkSymbol,
            );

            if (A.isNotEmpty(validTokens)) {
                return {
                    numberOfAccounts,
                    tokenSymbols: validTokens.map(([_, tokenSymbol]) => tokenSymbol),
                    tokenAddresses: validTokens.map(([tokenAddress, _]) => tokenAddress),
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
    forcedAreTestnetsEnabled?: boolean,
) => {
    const enabledNetworkSymbols = selectEnabledDiscoveryNetworkSymbols(
        state,
        forcedAreTestnetsEnabled,
    );
    const accounts = selectDeviceAccounts(state);
    const supportedNetworks = selectDiscoverySupportedNetworks(state, forcedAreTestnetsEnabled);

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

    const networksWithUnfinishedDiscovery = selectNetworksWithUnfinishedDiscovery(state);

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

    const isCoinEnablingInitFinished = selectIsCoinEnablingInitFinished(state);
    const hasDiscovery = selectHasDeviceDiscovery(state);
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

    return (
        isCoinEnablingInitFinished &&
        !hasDiscovery &&
        isDeviceConnectedAndAuthorized &&
        !isPortfolioTrackerDevice &&
        !isDeviceInViewOnlyMode &&
        isDeviceUnlocked &&
        !hasDeviceAuthConfirm &&
        !hasDeviceAuthFailed &&
        isDeviceFirmwareVersionSupported
    );
};
