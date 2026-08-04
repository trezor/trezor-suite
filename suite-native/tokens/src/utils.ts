import { G, S } from '@mobily/ts-belt';

import {
    type NetworkConfigDeps,
    type NetworkSymbol,
    getNetworkFeatures,
} from '@suite-common/wallet-config';

export const getTokenName = (tokenName?: string) => {
    if (G.isNullable(tokenName) || S.isEmpty(tokenName)) return 'Unknown token';

    return tokenName;
};

export const isNetworkWithTokens = (deps: NetworkConfigDeps, symbol: NetworkSymbol) =>
    getNetworkFeatures(deps, symbol).includes('tokens');
