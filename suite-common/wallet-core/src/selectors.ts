import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import { NetworkSymbol, networksCollection } from '@suite-common/wallet-config';
import { ReviewOutput } from '@suite-common/wallet-types';
import {
    findAccountsByAddress,
    isAccountDiscoverable,
    sortByCoin,
} from '@suite-common/wallet-utils';
import { StaticSessionId, type TrezorConnect } from '@trezor/connect';
import { arrayToDictionary } from '@trezor/utils';

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

const selectEnabledSupportedNetworks = createMemoizedSelector(
    [selectEnabledNetworks, selectSelectedDevice],
    (enabledNetworks, device) => {
        const deviceNetworks = selectSupportedNetworkByDevice(device);
        const supportedNetworks = enabledNetworks.filter(n => deviceNetworks.includes(n));

        return returnStableArrayIfEmpty(supportedNetworks);
    },
);

/**
 * Listable accounts are visible, enabled in settings, supported by the device and conventionally sorted.
 * Edge cases: accounts failed to be discovered, or remembered accounts no longer supported by the device.
 */
export const selectAllAccountsToList = createMemoizedSelector(
    [selectVisibleDeviceAccounts, selectEnabledSupportedNetworks],
    (accounts, enabledSupportedNetworks) => {
        const filteredAccounts = accounts.filter(({ symbol }) =>
            enabledSupportedNetworks.includes(symbol),
        );

        const sortedAccounts = sortByCoin(filteredAccounts);

        return returnStableArrayIfEmpty(sortedAccounts);
    },
);

export const selectAllSuccessfulAccountsToList = createMemoizedSelector(
    [selectAllAccountsToList],
    accounts => {
        const filteredAccounts = accounts.filter(account => !account.failed);

        return returnStableArrayIfEmpty(filteredAccounts);
    },
);

type DiscoveryAccountsParam = Parameters<TrezorConnect['discoverAccounts']>[0]['coins'];

export const selectDiscoveryAccountsParam = (
    state: CompoundRootState,
    staticSessionId: StaticSessionId,
    knownOnly?: boolean,
): DiscoveryAccountsParam => {
    const networks = selectEnabledSupportedNetworks(state);
    const knownAccounts = selectAccountsByDeviceState(state, staticSessionId);
    const discoverableAccounts = knownAccounts.filter(isAccountDiscoverable);

    const symbolMap = arrayToDictionary(discoverableAccounts, acc => acc.symbol, true);

    return networks.map(symbol => {
        const symbolAccounts = symbolMap[symbol];

        // undiscovered network; discover as a whole
        if (!symbolAccounts) return { symbol };

        // discovered network; separate by account type
        const typeMap = arrayToDictionary(symbolAccounts, acc => acc.accountType, true);

        const known = Object.entries(typeMap).map(([type, accs]) => {
            // account with the highest index
            const lastAccount = accs.reduce((last, current) =>
                current.index > last.index ? current : last,
            );

            // last account is a failed one; try to discover it again
            if (lastAccount.failed) return { type, skip: lastAccount.index };
            // last account is a used one; skip it and try to discover next one
            else if (!lastAccount.empty) return { type, skip: lastAccount.index + 1 };
            // last account is an empty one; skip this type completely
            else return { type };
        });

        return { symbol, known, knownOnly } as DiscoveryAccountsParam[number];
    });
};

export const selectShouldRediscoverNetworks = (
    state: CompoundRootState,
    staticSessionId?: StaticSessionId,
) => {
    if (!staticSessionId) return false;
    if (selectHasRunningDiscovery(state)) return false;

    const networks = selectEnabledSupportedNetworks(state);
    const accounts = selectAccountsByDeviceState(state, staticSessionId);
    const discoveredNetworks = new Set(accounts.map(account => account.symbol));

    return networks.some(network => !discoveredNetworks.has(network));
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
