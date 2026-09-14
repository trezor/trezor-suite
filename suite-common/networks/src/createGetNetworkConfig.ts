import type { NetworkModuleRepositoryDep } from './NetworkModuleRepository';
import type { NetworkSymbol } from './NetworkModules';
import type { NetworkMetadata } from '../reduxState/NetworkMetadata';

export type GetNetworkConfigDeps = NetworkModuleRepositoryDep;

export type GetNetworkConfig = (symbol: NetworkSymbol) => NetworkMetadata;

export type GetNetworkConfigDep = { getNetworkConfig: GetNetworkConfig };

export const createGetNetworkConfig = (deps: GetNetworkConfigDeps): GetNetworkConfig => {
    const configs = new Map<NetworkSymbol, NetworkMetadata>();

    return symbol => {
        const existing = configs.get(symbol);
        if (existing) return existing;

        const config = {
            ...deps.networkModuleRepository.get(symbol).getNetworkConfig(symbol),
            symbol,
        };
        configs.set(symbol, config);

        return config;
    };
};
