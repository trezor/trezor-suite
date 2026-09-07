import type { NetworkSymbol } from './NetworkModules';
import type { NetworkModuleRepositoryDep } from './createNetworkModuleRepository';

export type IsTestnetDeps = NetworkModuleRepositoryDep;

export type IsTestnet = (symbol: NetworkSymbol) => boolean;

export type IsTestnetDep = {
    isTestnet: IsTestnet;
};

export const selectIsTestnetDep = (services: any): IsTestnetDep => ({
    isTestnet: services.networks.isTestnet,
});

export const createIsTestnet =
    (deps: IsTestnetDeps): IsTestnet =>
    symbol =>
        deps.networkModuleRepository.get(symbol).isTestnet(symbol);
