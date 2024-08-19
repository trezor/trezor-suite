import { G, S } from '@mobily/ts-belt';

import { NetworkSymbol, Network, getNetworkType } from '@suite-common/wallet-config';

export const getEthereumTokenName = (tokenName?: string) => {
    if (G.isNullable(tokenName) || S.isEmpty(tokenName)) return 'Unknown token';

    return tokenName;
};

export const NETWORKS_WITH_TOKENS = ['ethereum'] as const satisfies Array<Network['networkType']>;
export type NetworksWithTokens = (typeof NETWORKS_WITH_TOKENS)[number];

export const isNetworkTypeWithTokens = (
    networkType: Network['networkType'],
): networkType is NetworksWithTokens => {
    return NETWORKS_WITH_TOKENS.includes(networkType as NetworksWithTokens);
};

export const isCoinWithTokens = (symbol: NetworkSymbol) => {
    const networkType = getNetworkType(symbol);

    return isNetworkTypeWithTokens(networkType);
};
