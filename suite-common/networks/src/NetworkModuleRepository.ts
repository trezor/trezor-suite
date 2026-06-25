import type { NetworkModule } from '@network-module/suite-types';

import { isArrayMember, typedObjectValues } from '@trezor/utils';

import type { CoinSymbol, StaticNetworkModulesDep } from './NetworkModules';

export type NetworkModuleRepository = {
    get: <T extends CoinSymbol>(symbol: T) => NetworkModule<T>;
    getSupportedCoins: () => readonly CoinSymbol[];
    isSupportedCoin: (symbol: string) => symbol is CoinSymbol;
};

export type NetworkModuleRepositoryDep = {
    networkModuleRepository: NetworkModuleRepository;
};

export type NetworkModuleRepositoryDeps = StaticNetworkModulesDep;

export const createNetworkModuleRepository = (
    deps: NetworkModuleRepositoryDeps,
): NetworkModuleRepository => {
    const networkModuleByCoinSymbol = new Map<CoinSymbol, NetworkModule<CoinSymbol>>();

    typedObjectValues(deps.networkModules).forEach(networkModule => {
        networkModule.getSupportedCoins().forEach(networkSymbol => {
            networkModuleByCoinSymbol.set(networkSymbol, networkModule);
        });
    });

    const supportedCoins = Array.from(networkModuleByCoinSymbol.keys());

    return {
        get: <T extends CoinSymbol>(symbol: T): NetworkModule<T> => {
            const networkModule = networkModuleByCoinSymbol.get(symbol);

            if (!networkModule) {
                throw new Error(`Network module for ${symbol} is not registered.`);
            }

            return networkModule as NetworkModule<T>;
        },
        getSupportedCoins: (): readonly CoinSymbol[] => supportedCoins,
        isSupportedCoin: (symbol: string): symbol is CoinSymbol =>
            isArrayMember(symbol, supportedCoins),
    };
};

export const selectNetworkModuleRepositoryDep = (services: any): NetworkModuleRepositoryDep => ({
    networkModuleRepository: services.networkModuleRepository,
});
