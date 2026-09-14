import type { SuiteNetworkModule } from '@trezor/network-module-suite-types';
import { isArrayMember, typedObjectValues } from '@trezor/utils';

import type { StaticSuiteNetworkModulesDep, SuiteNetworkSymbol } from './SuiteNetworkModules';

export type SuiteNetworkModuleRepositoryDeps = StaticSuiteNetworkModulesDep;

export type SuiteNetworkModuleRepository = {
    get: <T extends SuiteNetworkSymbol>(symbol: T) => SuiteNetworkModule<T>;
    getSupportedNetworks: () => readonly SuiteNetworkSymbol[];
    isSupportedNetwork: (symbol: string) => symbol is SuiteNetworkSymbol;
};

export type SuiteNetworkModuleRepositoryDep = {
    suiteNetworkModuleRepository: SuiteNetworkModuleRepository;
};

export const createSuiteNetworkModuleRepository = (
    deps: SuiteNetworkModuleRepositoryDeps,
): SuiteNetworkModuleRepository => {
    const networkModuleByNetworkSymbol = new Map<
        SuiteNetworkSymbol,
        SuiteNetworkModule<SuiteNetworkSymbol>
    >();

    typedObjectValues(deps.suiteNetworkModules).forEach(networkModule => {
        networkModule.getSupportedNetworks().forEach((networkSymbol: SuiteNetworkSymbol) => {
            networkModuleByNetworkSymbol.set(networkSymbol, networkModule);
        });
    });

    const supportedNetworks = Array.from(networkModuleByNetworkSymbol.keys());

    return {
        get: <T extends SuiteNetworkSymbol>(symbol: T): SuiteNetworkModule<T> => {
            const networkModule = networkModuleByNetworkSymbol.get(symbol);

            if (!networkModule) {
                throw new Error(`Suite network module for ${symbol} is not registered.`);
            }

            return networkModule as SuiteNetworkModule<T>;
        },
        getSupportedNetworks: (): readonly SuiteNetworkSymbol[] => supportedNetworks,
        isSupportedNetwork: (symbol: string): symbol is SuiteNetworkSymbol =>
            isArrayMember(symbol, supportedNetworks),
    };
};

export const selectSuiteNetworkModuleRepositoryDep = (
    services: any,
): SuiteNetworkModuleRepositoryDep => ({
    suiteNetworkModuleRepository: services.suiteNetworkModuleRepository,
});
