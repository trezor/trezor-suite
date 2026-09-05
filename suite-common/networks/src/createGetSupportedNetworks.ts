import type { NetworkModuleRepositoryDep } from './NetworkModuleRepository';
import type { NetworkSymbol } from './NetworkModules';

export type GetSupportedNetworks = () => readonly NetworkSymbol[];

export type GetSupportedNetworksDeps = NetworkModuleRepositoryDep;

export type GetSupportedNetworksDep = {
    getSupportedNetworks: GetSupportedNetworks;
};

export const selectGetSupportedNetworksDep = (services: any): GetSupportedNetworksDep => ({
    getSupportedNetworks: services.networks.getSupportedNetworks,
});

export const createGetSupportedNetworks = (deps: GetSupportedNetworksDeps): GetSupportedNetworks =>
    deps.networkModuleRepository.getSupportedNetworks;
