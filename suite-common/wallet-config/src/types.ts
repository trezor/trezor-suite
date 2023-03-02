import { networks, NetworkSymbol } from './networksConfig';

export const isNetworkSymbol = (symbol: NetworkSymbol | string): symbol is NetworkSymbol =>
    symbol in networks;
