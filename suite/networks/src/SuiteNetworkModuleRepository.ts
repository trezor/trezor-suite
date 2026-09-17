import type { NetworkSymbol } from '@trezor/network-module';
import type { SuiteNetworkModule } from '@trezor/network-module-suite-types';
import { isArrayMember, typedObjectValues } from '@trezor/utils';

import type { StaticSuiteNetworkModulesDep } from './SuiteNetworkModules';

export type SuiteNetworkModuleRepositoryDeps = StaticSuiteNetworkModulesDep;

export type SuiteNetworkModuleRepository = {
    get: (symbol: NetworkSymbol) => SuiteNetworkModule;
    getSupportedNetworks: () => readonly NetworkSymbol[];
    isSupportedNetwork: (symbol: string) => symbol is NetworkSymbol;
};

export type SuiteNetworkModuleRepositoryDep = {
    suiteNetworkModuleRepository: SuiteNetworkModuleRepository;
};

export const createSuiteNetworkModuleRepository = (
    deps: SuiteNetworkModuleRepositoryDeps,
): SuiteNetworkModuleRepository => {
    const networkModuleByNetworkSymbol = new Map<NetworkSymbol, SuiteNetworkModule>();

    typedObjectValues(deps.suiteNetworkModules).forEach(networkModule => {
        networkModule.getSupportedNetworks().forEach(networkSymbol => {
            networkModuleByNetworkSymbol.set(networkSymbol, networkModule);
        });
    });

    const supportedNetworks = Array.from(networkModuleByNetworkSymbol.keys());

    return {
        get: (symbol: NetworkSymbol): SuiteNetworkModule => {
            const networkModule = networkModuleByNetworkSymbol.get(symbol);

            if (!networkModule) {
                throw new Error(`Suite network module for ${symbol} is not registered.`);
            }

            return networkModule;
        },
        getSupportedNetworks: (): readonly NetworkSymbol[] => supportedNetworks,
        isSupportedNetwork: (symbol: string): symbol is NetworkSymbol =>
            isArrayMember(symbol, supportedNetworks),
    };
};

export const selectSuiteNetworkModuleRepositoryDep = (
    services: any,
): SuiteNetworkModuleRepositoryDep => ({
    suiteNetworkModuleRepository: services.suiteNetworkModuleRepository,
});
