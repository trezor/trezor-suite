import { type NetworkSymbol, getNetworkFeatures } from '@suite-common/wallet-config';

export const isNetworkWithTokens = (symbol: NetworkSymbol) =>
    getNetworkFeatures(symbol).includes('tokens');
