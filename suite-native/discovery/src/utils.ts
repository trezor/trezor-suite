import { A, F } from '@mobily/ts-belt';

import { NetworkCompatible, AccountType, NetworkSymbol } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';

const NORMAL_ACCOUNT_TYPE = 'normal';

// network uses undefined for normal type, but account uses 'normal'
const normalizedAccountType = (accountType?: AccountType) => accountType ?? NORMAL_ACCOUNT_TYPE;

export const getNetworksWithUnfinishedDiscovery = (
    enabledNetworks: readonly NetworkCompatible[],
    accounts: Account[],
    accountsLimit: number,
) =>
    enabledNetworks.filter(network => {
        const networkAccountsOfType = accounts.filter(
            account =>
                account.symbol === network.symbol &&
                account.accountType === normalizedAccountType(network.accountType),
        );

        // if there is no account for this network -> we should have at least one account even if added via Add Coin
        // or if there is at least one visible account of this type, we should have at least one hidden account so adding funds outside of this app is detected and account shown
        return (
            A.isEmpty(networkAccountsOfType) ||
            (networkAccountsOfType.length < accountsLimit &&
                networkAccountsOfType.every(account => account.visible))
        );
    });

export const getNetworkSymbols = (networks: readonly NetworkCompatible[]): NetworkSymbol[] =>
    F.toMutable(
        A.uniqBy(
            networks.map(n => n.symbol),
            F.identity,
        ),
    );
