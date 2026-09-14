import { type NetworkConfigDeps } from '@suite-common/networks';
import { G, S } from '@mobily/ts-belt';

import { type NetworkSymbol, getNetworkFeatures } from '@suite-common/wallet-config';

export const getTokenName = (tokenName?: string) => {
    if (G.isNullable(tokenName) || S.isEmpty(tokenName)) return 'Unknown token';

    return tokenName;
};

export const isNetworkWithTokens = (networkConfigDeps: NetworkConfigDeps, symbol: NetworkSymbol) =>
    getNetworkFeatures(networkConfigDeps, symbol).includes('tokens');
