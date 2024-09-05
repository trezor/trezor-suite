import { A, F } from '@mobily/ts-belt';

import { Network, NetworkSymbol } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';

export const getNetworksWithUnfinishedDiscovery = (
    enabledNetworks: readonly Network[],
    accounts: Account[],
    accountsLimit: number,
) =>
    enabledNetworks.filter(network => {
        const networkAccountsOfType = accounts.filter(({ symbol }) => symbol === network.symbol);

        // if there is no account for this network -> we should have at least one account even if added via Add Coin
        // or if there is at least one visible account of this type, we should have at least one hidden account so adding funds outside of this app is detected and account shown
        return (
            A.isEmpty(networkAccountsOfType) ||
            (networkAccountsOfType.length < accountsLimit &&
                networkAccountsOfType.every(account => account.visible))
        );
    });

export const getNetworkSymbols = (networks: readonly Network[]): NetworkSymbol[] =>
    F.toMutable(networks.map(n => n.symbol));
