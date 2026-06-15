import type { NetworkModule } from '@trezor/network-module-suite-types';
import { isArrayMember, typedObjectValues } from '@trezor/utils';

import type { NetworkSymbol, StaticNetworkModulesDep } from './NetworkModules';

export type NetworkModuleRepository = {
    get: <T extends NetworkSymbol>(symbol: T) => NetworkModule<T>;
    getSupportedNetworks: () => readonly NetworkSymbol[];
    isSupportedNetwork: (symbol: string) => symbol is NetworkSymbol;
};

export type NetworkModuleRepositoryDep = {
    networkModuleRepository: NetworkModuleRepository;
};

export type NetworkModuleRepositoryDeps = StaticNetworkModulesDep;

export const createNetworkModuleRepository = (
    deps: NetworkModuleRepositoryDeps,
): NetworkModuleRepository => {
    const networkModuleByNetworkSymbol = new Map<NetworkSymbol, NetworkModule<NetworkSymbol>>();

    typedObjectValues(deps.networkModules).forEach(networkModule => {
        networkModule.getSupportedNetworks().forEach(networkSymbol => {
            networkModuleByNetworkSymbol.set(networkSymbol, networkModule);
        });
    });

    const supportedNetworks = Array.from(networkModuleByNetworkSymbol.keys());

    return {
        get: <T extends NetworkSymbol>(symbol: T): NetworkModule<T> => {
            const networkModule = networkModuleByNetworkSymbol.get(symbol);

            if (!networkModule) {
                throw new Error(`Network module for ${symbol} is not registered.`);
            }

            return networkModule as NetworkModule<T>;
        },
        getSupportedNetworks: (): readonly NetworkSymbol[] => supportedNetworks,
        isSupportedNetwork: (symbol: string): symbol is NetworkSymbol =>
            isArrayMember(symbol, supportedNetworks),
    };
};

export const selectNetworkModuleRepositoryDep = (services: any): NetworkModuleRepositoryDep => ({
    networkModuleRepository: services.networkModuleRepository,
});
