import type { NetworkModuleRepositoryDep } from './NetworkModuleRepository';
import type { NetworkSymbol } from './NetworkModules';

export type IsTestnet = (symbol: NetworkSymbol) => boolean;

export type IsTestnetDeps = NetworkModuleRepositoryDep;

export type IsTestnetDep = {
    isTestnet: IsTestnet;
};

export const selectIsTestnetDep = (services: any): IsTestnetDep => ({
    isTestnet: services.networks.isTestnet,
});

export const createIsTestnet = (deps: IsTestnetDeps): IsTestnet =>
    deps.networkModuleRepository.isTestnet;
