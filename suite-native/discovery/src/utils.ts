import { A, F } from '@mobily/ts-belt';

import { AccountType, Network, NetworkSymbol } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';

export const getNetworksWithUnfinishedDiscovery = (
    enabledNetworks: readonly Network[],
    accounts: Account[],
    accountsLimit: number,
) =>
    enabledNetworks.filter(network => {
        // if there is no account for this network -> we should have at least one account even if added via Add Coin
        // or if there is at least one visible account of this type, we should have at least one hidden account so adding funds outside of this app is detected and account shown
        // the whole network is considered undiscovered if this is found for either 'normal' account, or any of the other accountTypes
        const isUndiscoveredAccountType = (accountType: AccountType) => {
            const networkAccountsOfType = accounts.filter(
                account => account.symbol === network.symbol && account.accountType === accountType,
            );

            return (
                A.isEmpty(networkAccountsOfType) ||
                (networkAccountsOfType.length < accountsLimit &&
                    networkAccountsOfType.every(account => account.visible))
            );
        };

        if (isUndiscoveredAccountType('normal')) return true;

        Object.values(network.accountTypes).forEach(({ accountType }) => {
            if (isUndiscoveredAccountType(accountType)) return true;
        });

        return false;
    });

export const getNetworkSymbols = (networks: readonly Network[]): NetworkSymbol[] =>
    F.toMutable(networks.map(n => n.symbol));
