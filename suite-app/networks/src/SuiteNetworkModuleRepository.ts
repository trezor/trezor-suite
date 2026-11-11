import type { SuiteNetworkModule } from '@trezor/network-module-suite-types';
import type { NetworkSymbol } from '@trezor/network-module-types';

export type SuiteNetworkModuleRepositoryDeps = {
    suiteNetworkModules: readonly SuiteNetworkModule[];
};

export type SuiteNetworkModuleRepository = {
    /** The desktop and web module of a network, if the network has one yet. */
    find: (symbol: NetworkSymbol) => SuiteNetworkModule | undefined;
};

export type SuiteNetworkModuleRepositoryDep = {
    suiteNetworkModuleRepository: SuiteNetworkModuleRepository;
};

export const createSuiteNetworkModuleRepository = (
    deps: SuiteNetworkModuleRepositoryDeps,
): SuiteNetworkModuleRepository => {
    const suiteNetworkModuleBySymbol = new Map<NetworkSymbol, SuiteNetworkModule>();

    deps.suiteNetworkModules.forEach(suiteNetworkModule => {
        suiteNetworkModule.getSupportedNetworks().forEach(symbol => {
            suiteNetworkModuleBySymbol.set(symbol, suiteNetworkModule);
        });
    });

    return {
        find: symbol => suiteNetworkModuleBySymbol.get(symbol),
    };
};
