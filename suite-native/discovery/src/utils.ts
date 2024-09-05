import { A } from '@mobily/ts-belt';

import { AccountType, Network, normalizeNetworkAccounts } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';

export const getNetworksWithUnfinishedDiscovery = ({
    enabledNetworks,
    accounts,
    accountsLimit,
    availableCardanoDerivations,
}: {
    enabledNetworks: readonly Network[];
    accounts: Account[];
    accountsLimit: number;
    availableCardanoDerivations?: AccountType[];
}) =>
    enabledNetworks.filter(network =>
        // if there is no account for this network -> we should have at least one account even if added via Add Coin
        // or if there is at least one visible account of this type, we should have at least one hidden account so adding funds outside of this app is detected and account shown
        // the whole network is considered undiscovered if this is found for either 'normal' account, or any of supported accountTypes
        normalizeNetworkAccounts(network).some(({ accountType }) => {
            // coinjoin and some cardano derivation might not be supported (cardano derivations are provided)
            if (
                'coinjoin' === accountType ||
                (network.networkType === 'cardano' &&
                    availableCardanoDerivations &&
                    !availableCardanoDerivations.includes(accountType))
            ) {
                return false;
            }

            const networkAccountsOfType = accounts.filter(
                account => account.symbol === network.symbol && account.accountType === accountType,
            );

            return (
                A.isEmpty(networkAccountsOfType) ||
                (networkAccountsOfType.length < accountsLimit &&
                    networkAccountsOfType.every(account => account.visible))
            );
        }),
    );
