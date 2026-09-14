import type { NetworkModuleRepositoryDep } from './NetworkModuleRepository';
import type { NetworkSymbol } from './NetworkModules';
import type { GetNetworkConfigDep } from './createGetNetworkConfig';
import { networkDisplayOrder } from './networkDisplayOrder';
import type { NetworkMetadata } from '../reduxState/NetworkMetadata';

export type GetNetworkConfigsDeps = GetNetworkConfigDep & NetworkModuleRepositoryDep;

export type GetNetworkConfigs = () => readonly NetworkMetadata[];

export type GetNetworkConfigsDep = { getNetworkConfigs: GetNetworkConfigs };

const displayOrderBySymbol = new Map(networkDisplayOrder.map((symbol, index) => [symbol, index]));

const getDisplayOrder = (symbol: NetworkSymbol) =>
    displayOrderBySymbol.get(symbol) ?? Number.MAX_SAFE_INTEGER;

export const createGetNetworkConfigs = (deps: GetNetworkConfigsDeps): GetNetworkConfigs => {
    const networks = deps.networkModuleRepository
        .getSupportedNetworks()
        .map(symbol => deps.getNetworkConfig(symbol))
        // Hermes does not support toSorted; map creates a new array that is safe to sort.
        .sort((a, b) => getDisplayOrder(a.symbol) - getDisplayOrder(b.symbol));

    return () => networks;
};
