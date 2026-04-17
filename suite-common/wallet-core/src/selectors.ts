import {
    type DeviceRootState,
    selectHasOnlyPortfolioDevice,
    selectSelectedDevice,
} from '@suite-common/device';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import { type TrezorDevice } from '@suite-common/suite-types';
import { type NetworkSymbol, networks, networksCollection } from '@suite-common/wallet-config';
import { type Account, type ReviewOutput } from '@suite-common/wallet-types';
import {
    findAccountsByAddress,
    isAccountDiscoverable,
    sortByCoin,
    tryGetAccountIdentity,
} from '@suite-common/wallet-utils';
import { type StaticSessionId, type TrezorConnect } from '@trezor/connect';
import { arrayToDictionary } from '@trezor/utils';

import { type AccountsRootState } from './accounts/accountsReducer';
import {
    selectAccounts,
    selectAccountsByDeviceState,
    selectDeviceAccountsByNetworkSymbol,
    selectIsDeviceAccountless,
    selectVisibleDeviceAccounts,
} from './accounts/accountsSelectors';
import { type BlockchainRootState, selectGapLimit } from './blockchain/blockchainReducer';
import { selectSupportedNetworkByDevice } from './device/deviceSelectors';
import { type DiscoveryRootState } from './discovery/discoveryReducer';
import { selectHasRunningDiscovery } from './discovery/discoverySelectors';
import {
    type WalletSettingsRootState,
    selectEnabledNetworks,
} from './settings/walletSettingsReducer';

/*
This file is for selectors that reach into more than one wallet-core reduce
to prevent circular dependencies between reducers
*/

export type WalletCoreCompoundRootState = AccountsRootState &
    DeviceRootState &
    DiscoveryRootState &
    WalletSettingsRootState &
    BlockchainRootState;
const createMemoizedSelector = createWeakMapSelector.withTypes<WalletCoreCompoundRootState>();

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

const getDeviceAccountsPerEnabledNetwork = (
    state: WalletCoreCompoundRootState,
    deviceState: StaticSessionId,
): { symbol: NetworkSymbol; accounts: Account[] | undefined }[] => {
    const symbols = selectEnabledSupportedNetworks(state);
    const knownAccounts = selectAccountsByDeviceState(state, deviceState);
    const discoverableAccounts = knownAccounts.filter(isAccountDiscoverable);
    const symbolMap = arrayToDictionary(discoverableAccounts, acc => acc.symbol, true);

    return symbols.map(symbol => ({ symbol, accounts: symbolMap[symbol] }));
};

const getLastAccountsPerAccountType = (accounts: Account[]) =>
    Object.entries(arrayToDictionary(accounts, acc => acc.accountType, true)).map(
        ([type, accs]) => ({
            type,
            // account with the highest index
            lastAccount: accs.reduce((last, current) =>
                current.index > last.index ? current : last,
            ),
        }),
    );

export const selectDiscoveryAccountsParam = (
    state: WalletCoreCompoundRootState,
    deviceState: StaticSessionId,
    knownOnly?: boolean,
): DiscoveryAccountsParam =>
    getDeviceAccountsPerEnabledNetwork(state, deviceState).map(({ symbol, accounts }) => {
        const { networkType } = networks[symbol];
        const identity = tryGetAccountIdentity({ networkType, deviceState });
        const bitcoinGap = networkType === 'bitcoin' ? selectGapLimit(state, symbol) : undefined;

        const includeErc4626 = networkType === 'ethereum' ? true : undefined;

        // undiscovered network; discover as a whole
        if (!accounts)
            return {
                symbol,
                identity,
                includeErc4626,
                gap: bitcoinGap,
            } as DiscoveryAccountsParam[number];

        const known = getLastAccountsPerAccountType(accounts).map(({ type, lastAccount }) => {
            // last account is a failed one; try to discover it again
            if (lastAccount.failed) return { type, skip: lastAccount.index };
            // last account is a used one; skip it and try to discover next one
            else if (!lastAccount.empty) return { type, skip: lastAccount.index + 1 };
            // last account is an empty one; skip this type completely
            else return { type };
        });

        return {
            symbol,
            identity,
            includeErc4626,
            known,
            knownOnly,
        } as DiscoveryAccountsParam[number];
    });

export const selectShowRediscoverButton = (
    state: WalletCoreCompoundRootState,
    device?: TrezorDevice,
) => {
    const staticSessionId = device?.state?.staticSessionId;
    if (!staticSessionId) return false;

    if (selectHasRunningDiscovery(state)) return false;

    const symbols = selectEnabledSupportedNetworks(state);
    const accounts = selectAccountsByDeviceState(state, staticSessionId);
    const discoveredNetworks = new Set(accounts.map(account => account.symbol));

    return symbols.some(symbol => !discoveredNetworks.has(symbol));
};

export const selectShouldRediscover = (
    state: WalletCoreCompoundRootState,
    device: TrezorDevice,
) => {
    if (selectHasRunningDiscovery(state)) return false;

    const staticSessionId = device.state?.staticSessionId;
    if (!staticSessionId) return true;

    if (!device.discovered) return true;

    return getDeviceAccountsPerEnabledNetwork(state, staticSessionId).some(
        ({ accounts }) =>
            !accounts ||
            getLastAccountsPerAccountType(accounts).some(
                ({ lastAccount }) => !lastAccount.failed && !lastAccount.empty,
            ),
    );
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
        (_state: WalletCoreCompoundRootState, symbol?: NetworkSymbol, output?: ReviewOutput) => ({
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
