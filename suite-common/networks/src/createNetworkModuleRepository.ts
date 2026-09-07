import type { SuiteCommonNetworkModule } from '@trezor/network-module-suite-common-types';
import { typedObjectValues } from '@trezor/utils';

import type { NetworkSymbol, StaticNetworkModulesDep } from './NetworkModules';

export type NetworkModuleRepositoryDeps = StaticNetworkModulesDep;

export type NetworkModuleRepository = {
    get: <T extends NetworkSymbol>(symbol: T) => SuiteCommonNetworkModule<T>;
};

export type NetworkModuleRepositoryDep = {
    networkModuleRepository: NetworkModuleRepository;
};

export const createNetworkModuleRepository = (
    deps: NetworkModuleRepositoryDeps,
): NetworkModuleRepository => {
    const networkModuleByNetworkSymbol = new Map<
        NetworkSymbol,
        SuiteCommonNetworkModule<NetworkSymbol>
    >();

    typedObjectValues(deps.networkModules).forEach(networkModule => {
        networkModule.getSupportedNetworks().forEach(networkSymbol => {
            networkModuleByNetworkSymbol.set(networkSymbol, networkModule);
        });
    });

    return {
        get: <T extends NetworkSymbol>(symbol: T): SuiteCommonNetworkModule<T> => {
            const networkModule = networkModuleByNetworkSymbol.get(symbol);

            if (!networkModule) {
                throw new Error(`Network module for ${symbol} is not registered.`);
            }

            return networkModule as SuiteCommonNetworkModule<T>;
        },
    };
};
