import { networks, NetworkSymbol } from './networksConfig';

export const isNetworkSymbol = (symbol: NetworkSymbol | string): symbol is NetworkSymbol =>
    symbol in networks;

export const isEthereumBasedNetwork = (
    network: (typeof networks)[NetworkSymbol],
): network is (typeof networks)[NetworkSymbol] & { chainId: number } =>
    network.networkType === 'ethereum';
