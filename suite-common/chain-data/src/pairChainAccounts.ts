import type { ChainAccountRef, ChainNetwork } from '@trezor/network-module-suite-common-types';

import type { PortfolioAccount } from './PortfolioAccount';

export type ChainAccountPair = {
    readonly accountId: PortfolioAccount['id'];
    readonly network: ChainNetwork;
    readonly ref: ChainAccountRef;
};

export type PairedChainAccounts = {
    readonly pairs: readonly ChainAccountPair[];

    /** One pair per distinct chain account: what to query, since several accounts can share one. */
    readonly uniquePairs: readonly ChainAccountPair[];

    /** Chain accounts on a network that is not selected or not migrated yet. */
    readonly uncoveredRefs: readonly ChainAccountRef[];
};

/** Identifies a chain account the way its queries are keyed. */
export const getChainAccountPairKey = (pair: Pick<ChainAccountPair, 'network' | 'ref'>) =>
    `${pair.network.symbol}/${pair.ref.descriptor}`;

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
                pairs.push({ accountId: account.id, network, ref });
            } else {
                uncoveredRefs.push(ref);
            }
        }),
    );

    const uniquePairs = [
        ...new Map(pairs.map(pair => [getChainAccountPairKey(pair), pair])).values(),
    ];

    return { pairs, uniquePairs, uncoveredRefs };
};
