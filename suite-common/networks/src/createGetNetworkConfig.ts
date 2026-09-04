import type { NetworkSymbol } from '@trezor/network-module';
import type { SuiteCommonNetworkConfig } from '@trezor/network-module-suite-common-types';

import type { NetworkModuleRepositoryDep } from './NetworkModuleRepository';

export type GetNetworkConfig = (symbol: NetworkSymbol) => SuiteCommonNetworkConfig;

export type GetNetworkConfigDeps = NetworkModuleRepositoryDep;

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
