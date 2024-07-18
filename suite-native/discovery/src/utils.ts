import { A, F } from '@mobily/ts-belt';

import { Network, AccountType, NetworkSymbol } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';

const NORMAL_ACCOUNT_TYPE = 'normal';

// network uses undefined for normal type, but account uses 'normal'
const normalizedAccountType = (accountType?: AccountType) => accountType ?? NORMAL_ACCOUNT_TYPE;

const isNormalAccountType = (accountType?: AccountType) =>
    normalizedAccountType(accountType) === NORMAL_ACCOUNT_TYPE;

export const getNetworksWithUnfinishedDiscovery = (
    enabledNetworks: readonly Network[],
    accounts: Account[],
    accountsLimit: number,
) =>
    enabledNetworks.filter(network => {
        // there is no normal account for this network -> we should have at least one normal account even if added via Add Coin
        if (
            A.isEmpty(
                accounts.filter(
                    account =>
                        account.symbol === network.symbol &&
                        isNormalAccountType(account.accountType),
                ),
            )
        ) {
            return true;
        }

        const networkAccountsOfType = accounts.filter(
            account =>
                account.symbol === network.symbol &&
                account.accountType === normalizedAccountType(network.accountType),
        );

        // if there is at least one visible account of this type, we should have at least one hidden account so adding funds outside of this app is detected and account shown
        return (
            networkAccountsOfType.length < accountsLimit &&
            networkAccountsOfType.every(account => account.visible)
        );
    });

export const getNetworkSymbols = (networks: readonly Network[]): NetworkSymbol[] =>
    F.toMutable(
        A.uniqBy(
            networks.map(n => n.symbol),
            F.identity,
        ),
    );
