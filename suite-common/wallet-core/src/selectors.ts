import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import { networksCollection } from '@suite-common/wallet-config';
import { getFailedAccounts, sortByCoin } from '@suite-common/wallet-utils';
import { StaticSessionId } from '@trezor/connect';

import { AccountsRootState } from './accounts/accountsReducer';
import {
    selectAccounts,
    selectAccountsByDeviceState,
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
import {
    selectDiscoveryByDevicePath,
    selectDiscoveryForSelectedDevice,
    selectHasRunningDiscovery,
} from './discovery/discoverySelectors';
import { WalletSettingsRootState, selectEnabledNetworks } from './settings/walletSettingsReducer';

/*
This file is for selectors that reach into more than one wallet-core reduce
to prevent circular dependencies between reducers
*/

const createMemoizedSelector = createWeakMapSelector.withTypes<
    AccountsRootState & DeviceRootState & DiscoveryRootState & WalletSettingsRootState
>();

export const selectDeviceAccountsVisibleEnabledAndSupported = createMemoizedSelector(
    [selectVisibleDeviceAccounts, selectSelectedDevice, selectEnabledNetworks],
    (accounts, device, enabledNetworks) => {
        const deviceNetworks = selectSupportedNetworkByDevice(device);

        return accounts.filter(
            ({ symbol }) => enabledNetworks.includes(symbol) && deviceNetworks.includes(symbol),
        );
    },
);

export const selectAllAccountsToList = createMemoizedSelector(
    [
        selectDeviceAccountsVisibleEnabledAndSupported,
        selectSelectedDevice,
        selectDiscoveryForSelectedDevice,
    ],
    (okAccounts, device, discovery) => {
        const staticSessionId = device?.state?.staticSessionId;
        const failedAccounts = getFailedAccounts(staticSessionId, discovery);
        const allAccounts = [...okAccounts, ...failedAccounts];
        const sortedAccounts = sortByCoin(allAccounts);

        return returnStableArrayIfEmpty(sortedAccounts);
    },
);

export const selectNetworksToDiscover = (
    state: DiscoveryRootState & DeviceRootState & AccountsRootState & WalletSettingsRootState,
    staticSessionId?: StaticSessionId,
) => {
    const enabledNetworks = selectEnabledNetworks(state);

    if (!staticSessionId) {
        return enabledNetworks;
    }
    const device = selectSelectedDevice(state);
    const discovery = selectDiscoveryByDevicePath(state, device?.path);
    const okAccounts = selectAccountsByDeviceState(state, staticSessionId);
    const failedAccounts = getFailedAccounts(staticSessionId, discovery);

    const discoveredNetworks = [
        ...new Set([...okAccounts, ...failedAccounts].map(account => account.symbol)),
    ];

    return enabledNetworks.filter(network => !discoveredNetworks.includes(network));
};

export const selectIsRediscoverNeeded = (
    state: DiscoveryRootState & DeviceRootState & AccountsRootState & WalletSettingsRootState,
    staticSessionId?: StaticSessionId,
) => {
    if (!staticSessionId) return false;

    const networksToDiscover = selectNetworksToDiscover(state, staticSessionId);

    return networksToDiscover.length > 0;
};

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
