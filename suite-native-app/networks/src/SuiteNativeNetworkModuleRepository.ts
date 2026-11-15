import type { SuiteNativeNetworkModule } from '@trezor/network-module-suite-native-types';
import type { NetworkSymbol } from '@trezor/network-module-types';
import { isArrayMember } from '@trezor/utils';

export type SuiteNativeNetworkModuleRepositoryDeps = {
    suiteNativeNetworkModules: readonly SuiteNativeNetworkModule[];
};

export type SuiteNativeNetworkModuleRepository = {
    get: (symbol: NetworkSymbol) => SuiteNativeNetworkModule;
    getSupportedNetworks: () => readonly NetworkSymbol[];
    isSupportedNetwork: (symbol: string) => symbol is NetworkSymbol;
};

export const createSuiteNativeNetworkModuleRepository = (
    deps: SuiteNativeNetworkModuleRepositoryDeps,
): SuiteNativeNetworkModuleRepository => {
    const networkModuleBySymbol = new Map<NetworkSymbol, SuiteNativeNetworkModule>();
    deps.suiteNativeNetworkModules.forEach(networkModule => {
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
