import {
    type Network,
    type NetworkAccount,
    type NetworkSymbol,
    WATCH_ONLY_ACCOUNT_TYPE,
} from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { canAddWatchOnlyAccount, isAccountWatchOnly } from '@suite-common/wallet-utils';
import { arrayPartition } from '@trezor/utils';

type GetSortedNetworksParams = {
    availableNetworks: Network[];
    enabledNetworkSymbols: NetworkSymbol[];
};

export const getSortedNetworks = ({
    availableNetworks,
    enabledNetworkSymbols,
}: GetSortedNetworksParams) => {
    const [enabledNetworks, disabledNetworks] = arrayPartition(availableNetworks, network =>
        enabledNetworkSymbols.includes(network.symbol),
    );

    return [...enabledNetworks, ...disabledNetworks];
};

export const getVisibleAccountCounts = (accounts: Account[], deviceState?: string) =>
    accounts.reduce<Partial<Record<NetworkSymbol, number>>>((counts, account) => {
        if (account.deviceState !== deviceState || !account.visible) {
            return counts;
        }

        counts[account.symbol] = (counts[account.symbol] ?? 0) + 1;

        return counts;
    }, {});

export const enqueueNetworkActivation = (
    queuedNetworkSymbols: NetworkSymbol[],
    networkSymbol: NetworkSymbol,
) =>
    queuedNetworkSymbols.includes(networkSymbol)
        ? queuedNetworkSymbols
        : [...queuedNetworkSymbols, networkSymbol];

type GetAddableAccountTypesParams = {
    network: Network;
    isDeviceConnected: boolean;
    isDebugModeEnabled: boolean;
    getDerivedAccountTypes: () => NetworkAccount[];
};

/**
 * A disconnected wallet can't derive accounts, but it can still watch an address.
 */
export const getAddableAccountTypes = ({
    network,
    isDeviceConnected,
    isDebugModeEnabled,
    getDerivedAccountTypes,
}: GetAddableAccountTypesParams): NetworkAccount[] | undefined => {
    const watchOnlyAccountTypes: NetworkAccount[] = canAddWatchOnlyAccount(
        network.networkType,
        isDebugModeEnabled,
    )
        ? [{ accountType: WATCH_ONLY_ACCOUNT_TYPE, bip43Path: network.bip43Path }]
        : [];

    if (!isDeviceConnected) {
        return watchOnlyAccountTypes.length ? watchOnlyAccountTypes : undefined;
    }

    return [...getDerivedAccountTypes(), ...watchOnlyAccountTypes];
};

// The watch-only type always needs the step, for its address input.
export const hasTypeSelectionStep = (accountTypes: NetworkAccount[] | undefined) =>
    !!accountTypes &&
    (accountTypes.length > 1 || (!!accountTypes[0] && isAccountWatchOnly(accountTypes[0])));
