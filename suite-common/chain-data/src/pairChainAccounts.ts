import type { ChainAccountRef, ChainNetwork } from '@trezor/network-module-suite-common-types';

import type { PortfolioAccount } from './PortfolioAccount';

export type ChainAccountPair = {
    readonly network: ChainNetwork;
    readonly ref: ChainAccountRef;
};

export type PairedChainAccounts = {
    readonly pairs: readonly ChainAccountPair[];

    /** Chain accounts on a network that is not selected or not migrated yet. */
    readonly uncoveredRefs: readonly ChainAccountRef[];
};

/** Matches every chain account of the given accounts with the selected network it lives on. */
export const pairChainAccounts = (
    networks: readonly ChainNetwork[],
    accounts: readonly PortfolioAccount[],
): PairedChainAccounts => {
    const networkBySymbol = new Map(networks.map(network => [network.symbol, network]));
    const pairs: ChainAccountPair[] = [];
    const uncoveredRefs: ChainAccountRef[] = [];

    accounts.forEach(account =>
        account.chainAccounts.forEach(ref => {
            const network = networkBySymbol.get(ref.symbol);

            if (network) {
                pairs.push({ network, ref });
            } else {
                uncoveredRefs.push(ref);
            }
        }),
    );

    return { pairs, uncoveredRefs };
};
