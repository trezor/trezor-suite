import { A, D, O, S, pipe } from '@mobily/ts-belt';

import {
    TokenDefinitionsRootState,
    selectIsSpecificCoinDefinitionKnown,
} from '@suite-common/token-definitions';
import { AccountType, NetworkSymbol } from '@suite-common/wallet-config';
import {
    AccountsRootState,
    DeviceRootState,
    DiscoveryRootState,
    selectAccountsByNetworkAndDeviceState,
    selectDeviceAccounts,
    selectDeviceAuthFailed,
    selectDeviceFirmwareVersion,
    selectDeviceModel,
    selectDeviceState,
    selectHasDeviceAuthConfirm,
    selectHasDeviceDiscovery,
    selectIsDeviceConnectedAndAuthorized,
    selectIsDeviceInViewOnlyMode,
    selectIsDeviceUnlocked,
    selectIsPortfolioTrackerDevice,
} from '@suite-common/wallet-core';
import { TokenAddress, TokenSymbol } from '@suite-common/wallet-types';
import { isFirmwareVersionSupported } from '@suite-native/device';
import { FeatureFlagsRootState } from '@suite-native/feature-flags';
import { selectIsCoinEnablingInitFinished } from '@suite-native/settings';
import { StaticSessionId } from '@trezor/connect';

import {
    DiscoveryConfigSliceRootState,
    selectDeviceEnabledDiscoveryNetworkSymbols,
    selectDiscoverySupportedNetworks,
} from './discoveryConfigSlice';
import { getNetworksWithUnfinishedDiscovery } from './utils';

export const selectValidTokensByDeviceStateAndNetworkSymbol = (
    state: TokenDefinitionsRootState & DeviceRootState & AccountsRootState,
    deviceState: StaticSessionId,
    symbol: NetworkSymbol,
) => {
    const accountsByDeviceStateAndNetworkSymbol = selectAccountsByNetworkAndDeviceState(
        state,
        deviceState,
        symbol,
    );

    return pipe(
        accountsByDeviceStateAndNetworkSymbol,
        A.filter(account => account.symbol === symbol),
        A.map(account => account.tokens),
        A.flat,

        A.filterMap(token => {
            if (token?.contract === undefined) {
                return O.None;
            }

            const tokenContract = token.contract as TokenAddress;
            const tokenSymbol = token.symbol as TokenSymbol;

            if (selectIsSpecificCoinDefinitionKnown(state, symbol, tokenContract)) {
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
    deviceState: StaticSessionId,
) =>
    pipe(
        selectDeviceAccounts(state),
        A.groupBy(account => account.symbol),
        D.mapWithKey((symbol, accounts) => {
            const accountsWithTransactionHistory = accounts?.filter(acc => !acc.empty) || [];

            const numberOfAccounts = accountsWithTransactionHistory?.length;

            const numberOfNonZeroAccounts = accountsWithTransactionHistory?.filter(
                acc => parseFloat(acc.balance) > 0,
            ).length;

            const validTokens = selectValidTokensByDeviceStateAndNetworkSymbol(
                state,
                deviceState,
                symbol,
            );

            if (A.isNotEmpty(validTokens)) {
                return {
                    numberOfAccounts,
                    numberOfNonZeroAccounts,
                    tokenSymbols: validTokens.map(([_, tokenSymbol]) => tokenSymbol),
                    tokenAddresses: validTokens.map(([tokenAddress, _]) => tokenAddress),
                };
            }

            return {
                numberOfAccounts,
                numberOfNonZeroAccounts,
            };
        }),
    );

export const selectNetworksWithUnfinishedDiscovery = (
    state: DeviceRootState &
        AccountsRootState &
        FeatureFlagsRootState &
        DiscoveryConfigSliceRootState,
    forcedAreTestnetsEnabled?: boolean,
    availableCardanoDerivations?: AccountType[],
) => {
    const enabledNetworkSymbols = selectDeviceEnabledDiscoveryNetworkSymbols(
        state,
        forcedAreTestnetsEnabled,
    );
    const accounts = selectDeviceAccounts(state);
    const supportedNetworks = selectDiscoverySupportedNetworks(state, forcedAreTestnetsEnabled);

    const enabledNetworks = supportedNetworks.filter(n => enabledNetworkSymbols.includes(n.symbol));

    return getNetworksWithUnfinishedDiscovery({
        enabledNetworks,
        accounts,
        accountsLimit: 10, // will be skipped anyway
        availableCardanoDerivations,
    });
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
    if (!deviceState?.staticSessionId) {
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
