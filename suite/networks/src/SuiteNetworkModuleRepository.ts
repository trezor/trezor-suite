import type { SuiteNetworkModule } from '@trezor/network-module-suite-types';

import type { StaticSuiteNetworkModulesDep, SuiteNetworkSymbol } from './SuiteNetworkModules';

export type SuiteNetworkModuleRepository = {
    get: (symbol: string) => SuiteNetworkModule | undefined;
    getSupportedNetworks: () => readonly SuiteNetworkSymbol[];
};

export type SuiteNetworkModuleRepositoryDep = {
    suiteNetworkModuleRepository: SuiteNetworkModuleRepository;
};

export const createSuiteNetworkModuleRepository = ({
    suiteNetworkModules,
}: StaticSuiteNetworkModulesDep): SuiteNetworkModuleRepository => {
    const suiteNetworkModuleByNetworkSymbol = new Map<string, SuiteNetworkModule>();

    Object.values(suiteNetworkModules).forEach(suiteNetworkModule => {
        suiteNetworkModule.getSupportedNetworks().forEach(networkSymbol => {
            suiteNetworkModuleByNetworkSymbol.set(networkSymbol, suiteNetworkModule);
        });
    });

    const supportedNetworks = Array.from(
        suiteNetworkModuleByNetworkSymbol.keys(),
    ) as SuiteNetworkSymbol[];

    return {
        get: symbol => suiteNetworkModuleByNetworkSymbol.get(symbol),
        getSupportedNetworks: () => supportedNetworks,
    };
};

export const selectSuiteNetworkModuleRepositoryDep = (
    services: any,
): SuiteNetworkModuleRepositoryDep => ({
    suiteNetworkModuleRepository: services.suiteNetworkModuleRepository,
});
