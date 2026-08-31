import { type Network, type NetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { arrayPartition } from '@trezor/utils';

export const getSortedNetworks = ({
    availableNetworks,
    enabledNetworkSymbols,
}: {
    availableNetworks: Network[];
    enabledNetworkSymbols: NetworkSymbol[];
}) => {
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
