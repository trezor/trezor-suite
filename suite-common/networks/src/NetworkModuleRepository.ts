import type { NetworkSymbol } from '@trezor/network-module';
import type { SuiteCommonNetworkModule } from '@trezor/network-module-suite-common-types';
import { isArrayMember } from '@trezor/utils';

export type NetworkModuleRepositoryDeps = {
    networkModules: readonly SuiteCommonNetworkModule[];
};

export type NetworkModuleRepository = {
    get: (symbol: NetworkSymbol) => SuiteCommonNetworkModule;
    getSupportedNetworks: () => readonly NetworkSymbol[];
    isSupportedNetwork: (symbol: NetworkSymbol) => boolean;
    isTestnet: (symbol: NetworkSymbol) => boolean;
};

export type NetworkModuleRepositoryDep = {
    networkModuleRepository: NetworkModuleRepository;
};

export const createNetworkModuleRepository = (
    deps: NetworkModuleRepositoryDeps,
): NetworkModuleRepository => {
    const networkModuleByNetworkSymbol = new Map<NetworkSymbol, SuiteCommonNetworkModule>();

    deps.networkModules.forEach(networkModule => {
        networkModule.getSupportedNetworks().forEach(networkSymbol => {
            networkModuleByNetworkSymbol.set(networkSymbol, networkModule);
        });
    });

    const supportedNetworks = Array.from(networkModuleByNetworkSymbol.keys());

    return {
        get: (symbol: NetworkSymbol): SuiteCommonNetworkModule => {
            const networkModule = networkModuleByNetworkSymbol.get(symbol);

            if (!networkModule) {
                throw new Error(`Network module for ${symbol} is not registered.`);
            }

            return networkModule;
        },
        getSupportedNetworks: (): readonly NetworkSymbol[] => supportedNetworks,
        isSupportedNetwork: (symbol: NetworkSymbol): boolean =>
            isArrayMember(symbol, supportedNetworks),
        isTestnet: (symbol: NetworkSymbol): boolean => {
            const networkModule = networkModuleByNetworkSymbol.get(symbol);

            return networkModule?.isTestnet(symbol) ?? false;
        },
    };
};
