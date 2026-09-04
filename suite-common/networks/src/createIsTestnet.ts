import type { NetworkSymbol } from '@trezor/network-module';

import type { NetworkModuleRepositoryDep } from './NetworkModuleRepository';

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
