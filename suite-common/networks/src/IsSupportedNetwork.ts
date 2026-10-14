import type { NetworkSymbol } from './NetworkModules';

export type IsSupportedNetwork = (symbol: string) => symbol is NetworkSymbol;

export type IsSupportedNetworkDep = { isSupportedNetwork: IsSupportedNetwork };
