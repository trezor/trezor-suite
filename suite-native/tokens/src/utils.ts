import { G, S } from '@mobily/ts-belt';

import { NetworkSymbol, getNetworkFeatures } from '@suite-common/wallet-config';
import { isDevelopOrDebugEnv } from '@suite-native/config';

export const getTokenName = (tokenName?: string) => {
    if (G.isNullable(tokenName) || S.isEmpty(tokenName)) return 'Unknown token';

    return tokenName;
};

export const isNetworkWithTokens = (symbol: NetworkSymbol) => {
    if (symbol === 'xlm' && !isDevelopOrDebugEnv()) {
        return false;
    }

    return getNetworkFeatures(symbol).includes('tokens');
};
