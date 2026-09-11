import type { SuiteCommonNetworkConfig } from '@trezor/network-module-suite-common-types';

import type { NetworkModuleRepositoryDep } from './NetworkModuleRepository';
import type { NetworkSymbol } from './NetworkModules';

export type GetNetworkConfigDeps = NetworkModuleRepositoryDep;

export type GetNetworkConfig = (symbol: NetworkSymbol) => SuiteCommonNetworkConfig;

export type GetNetworkConfigDep = {
    getNetworkConfig: GetNetworkConfig;
};

export const createGetNetworkConfig =
    (deps: GetNetworkConfigDeps): GetNetworkConfig =>
    symbol =>
        deps.networkModuleRepository.get(symbol).getNetworkConfig(symbol);
