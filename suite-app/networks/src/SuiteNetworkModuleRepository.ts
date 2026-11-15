import type { SuiteNetworkModule } from '@trezor/network-module-suite-types';
import type { NetworkSymbol } from '@trezor/network-module-types';
import { isArrayMember } from '@trezor/utils';

export type SuiteNetworkModuleRepositoryDeps = {
    suiteNetworkModules: readonly SuiteNetworkModule[];
};

export type SuiteNetworkModuleRepository = {
    get: (symbol: NetworkSymbol) => SuiteNetworkModule;
    getSupportedNetworks: () => readonly NetworkSymbol[];
    isSupportedNetwork: (symbol: string) => symbol is NetworkSymbol;
};

export const createSuiteNetworkModuleRepository = (
    deps: SuiteNetworkModuleRepositoryDeps,
): SuiteNetworkModuleRepository => {
    const networkModuleBySymbol = new Map<NetworkSymbol, SuiteNetworkModule>();
    deps.suiteNetworkModules.forEach(networkModule => {
        networkModule.getSupportedNetworks().forEach(symbol => {
            networkModuleBySymbol.set(symbol, networkModule);
        });
    });
    const supportedNetworks = Array.from(networkModuleBySymbol.keys());

    return {
        get: symbol => {
            const networkModule = networkModuleBySymbol.get(symbol);
            if (!networkModule) {
                throw new Error(`Network module for ${symbol} is not registered.`);
            }

            return networkModule;
        },
        getSupportedNetworks: () => supportedNetworks,
        isSupportedNetwork: (symbol: string): symbol is NetworkSymbol =>
            isArrayMember(symbol, supportedNetworks),
    };
};
