import { type NetworkSymbol } from '@trezor/network-module-types';

import { type SuiteNetworkModule } from './SuiteNetworkModule';

export type SuiteNetworkModuleRepository = {
    get: (symbol: NetworkSymbol) => SuiteNetworkModule;
    getSupportedNetworks: () => readonly NetworkSymbol[];
    isSupportedNetwork: (symbol: string) => symbol is NetworkSymbol;
};

export type SuiteNetworkModuleRepositoryDep = {
    suiteNetworkModuleRepository: SuiteNetworkModuleRepository;
};

export const injectSuiteNetworkModuleRepository = (
    services: any,
): SuiteNetworkModuleRepositoryDep => ({
    suiteNetworkModuleRepository: services.suiteNetworkModuleRepository,
});
