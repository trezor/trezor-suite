import { G, S } from '@mobily/ts-belt';

import { type NetworkSymbol, getNetworkFeatures } from '@suite-common/wallet-config';

export const getTokenName = (tokenName?: string) => {
    if (G.isNullable(tokenName) || S.isEmpty(tokenName)) return 'Unknown token';

    return tokenName;
};

export const isNetworkWithTokens = (symbol: NetworkSymbol) =>
    getNetworkFeatures(symbol).includes('tokens');
