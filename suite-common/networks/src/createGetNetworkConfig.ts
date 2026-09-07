import type { SuiteCommonNetworkConfig } from '@trezor/network-module-suite-common-types';

import type { NetworkSymbol } from './NetworkModules';
import type { NetworkModuleRepositoryDep } from './createNetworkModuleRepository';

export type GetNetworkConfigDeps = NetworkModuleRepositoryDep;

export type GetNetworkConfig = (symbol: NetworkSymbol) => SuiteCommonNetworkConfig;

export type GetNetworkConfigDep = {
    getNetworkConfig: GetNetworkConfig;
};

export const selectGetNetworkConfigDep = (services: any): GetNetworkConfigDep => ({
    getNetworkConfig: services.networks.getNetworkConfig,
});

export const createGetNetworkConfig =
    (deps: GetNetworkConfigDeps): GetNetworkConfig =>
    symbol =>
        deps.networkModuleRepository.get(symbol).getNetworkConfig(symbol);
