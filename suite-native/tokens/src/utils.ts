import { G, S } from '@mobily/ts-belt';

import { type NetworkSymbol, getNetworkFeatures } from '@suite-common/wallet-config';

export const UNKNOWN_TOKEN_LABEL = 'Unknown token';

export const getTokenName = (tokenName?: string) => {
    if (G.isNullable(tokenName) || S.isEmpty(tokenName)) return UNKNOWN_TOKEN_LABEL;

    return tokenName;
};

export const isNetworkWithTokens = (symbol: NetworkSymbol) =>
    getNetworkFeatures(symbol).includes('tokens');
