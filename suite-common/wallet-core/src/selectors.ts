import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import { NetworkSymbol, networksCollection } from '@suite-common/wallet-config';
import { ReviewOutput } from '@suite-common/wallet-types';
import { findAccountsByAddress, sortByCoin } from '@suite-common/wallet-utils';
import { StaticSessionId } from '@trezor/connect';

import { AccountsRootState } from './accounts/accountsReducer';
import {
    selectAccounts,
    selectAccountsByDeviceState,
    selectDeviceAccountsByNetworkSymbol,
    selectIsDeviceAccountless,
    selectVisibleDeviceAccounts,
} from './accounts/accountsSelectors';
import { DeviceRootState } from './device/deviceReducer';
import {
    selectHasOnlyPortfolioDevice,
    selectSelectedDevice,
    selectSupportedNetworkByDevice,
} from './device/deviceSelectors';
import { DiscoveryRootState } from './discovery/discoveryReducer';
import { selectHasRunningDiscovery } from './discovery/discoverySelectors';
import { WalletSettingsRootState, selectEnabledNetworks } from './settings/walletSettingsReducer';

/*
This file is for selectors that reach into more than one wallet-core reduce
to prevent circular dependencies between reducers
*/

type CompoundRootState = AccountsRootState &
    DeviceRootState &
    DiscoveryRootState &
    WalletSettingsRootState;
const createMemoizedSelector = createWeakMapSelector.withTypes<CompoundRootState>();

/**
 * Listable accounts are visible, enabled in settings, supported by the device and conventionally sorted.
 * Edge cases: accounts failed to be discovered, or remembered accounts no longer supported by the device.
 */
export const selectAllAccountsToList = createMemoizedSelector(
    [selectVisibleDeviceAccounts, selectSelectedDevice, selectEnabledNetworks],
    (accounts, device, enabledNetworks) => {
        const deviceNetworks = selectSupportedNetworkByDevice(device);

        const filteredAccounts = accounts.filter(
            ({ symbol }) => enabledNetworks.includes(symbol) && deviceNetworks.includes(symbol),
        );
        const sortedAccounts = sortByCoin(filteredAccounts);

        return returnStableArrayIfEmpty(sortedAccounts);
    },
);

export const selectNetworksToDiscover = (
    state: DiscoveryRootState & DeviceRootState & AccountsRootState & WalletSettingsRootState,
    staticSessionId: StaticSessionId,
) => {
    const enabledNetworks = selectEnabledNetworks(state);
    const device = selectSelectedDevice(state);
    const deviceNetworks = selectSupportedNetworkByDevice(device);
    const networks = enabledNetworks.filter(network => deviceNetworks.includes(network));
    const accounts = selectAccountsByDeviceState(state, staticSessionId);

    const networkSet = new Set(networks);
    const allSet = new Set(accounts.map(a => a.symbol));
    const failedSet = new Set(accounts.filter(a => a.failed).map(a => a.symbol));

    return {
        failed: [...failedSet].filter(s => networkSet.has(s)),
        undiscovered: [...networkSet].filter(s => !allSet.has(s)),
    };
};

export const selectShowRediscoverButton = (
    state: DiscoveryRootState & DeviceRootState & AccountsRootState & WalletSettingsRootState,
    staticSessionId?: StaticSessionId,
) =>
    staticSessionId &&
    selectNetworksToDiscover(state, staticSessionId).undiscovered.length > 0 &&
    !selectHasRunningDiscovery(state);

export const selectAccountsToBeForgotten = (
    state: DiscoveryRootState & AccountsRootState & WalletSettingsRootState,
) => {
    const accounts = selectAccounts(state);
    const enabledNetworks = selectEnabledNetworks(state);
    // find disabled networks
    const disabledNetworks = networksCollection
        .filter(n => !enabledNetworks.includes(n.symbol) || n.isHidden)
        .map(n => n.symbol);
    // find accounts for disabled networks
    const accountsToRemove = accounts.filter(
        a => disabledNetworks.includes(a.symbol) && !a.imported,
    );

    return accountsToRemove;
};

export const selectIsDiscoveredDeviceAccountless = createMemoizedSelector(
    [selectIsDeviceAccountless, selectHasRunningDiscovery],
    (isAccountless, isDiscoveryActive) => isAccountless && !isDiscoveryActive,
);

export const selectHasOnlyEmptyPortfolioTracker = createMemoizedSelector(
    [selectIsDiscoveredDeviceAccountless, selectHasOnlyPortfolioDevice],
    (isDiscoveredAccountless, hasOnlyPortfolio) => isDiscoveredAccountless && hasOnlyPortfolio,
);

/**
 * Memoizing this selector is actually essential for performance, because every select accounts
 * operation is a potential rerender-hell due to the fetchAndUpdateAccountThunk.
 */
export const selectIsTxOutputInternal = createMemoizedSelector(
    [
        selectDeviceAccountsByNetworkSymbol,
        (_state: CompoundRootState, symbol?: NetworkSymbol, output?: ReviewOutput) => ({
            symbol,
            output,
        }),
    ],
    (accounts, { symbol, output }) => {
        if (!symbol || !output || output.type !== 'address') return false;
        const matchingAccounts = findAccountsByAddress(symbol, output.value, accounts);

        return matchingAccounts.length > 0;
    },
);
