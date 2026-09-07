import type { NetworkSymbol } from './NetworkModules';
import type { NetworkModuleRepositoryDep } from './createNetworkModuleRepository';

export type GetSupportedNetworksDeps = NetworkModuleRepositoryDep;

export type GetSupportedNetworks = () => readonly NetworkSymbol[];

export type GetSupportedNetworksDep = {
    getSupportedNetworks: GetSupportedNetworks;
};

export const selectGetSupportedNetworksDep = (services: any): GetSupportedNetworksDep => ({
    getSupportedNetworks: services.networks.getSupportedNetworks,
});

export const createGetSupportedNetworks = (deps: GetSupportedNetworksDeps): GetSupportedNetworks =>
    deps.networkModuleRepository.getSupportedNetworks;
