import type { SuiteCommonNetworkModule } from '@trezor/network-module-suite-common-types';
import { isArrayMember } from '@trezor/utils';

import type { NetworkSymbol, StaticNetworkModulesDep } from './NetworkModules';

export type NetworkModuleRepositoryDeps = StaticNetworkModulesDep;

export type NetworkModuleRepository = {
    get: (symbol: NetworkSymbol) => SuiteCommonNetworkModule;
    getSupportedNetworks: () => readonly NetworkSymbol[];
    isSupportedNetwork: (symbol: string) => symbol is NetworkSymbol;
    /** Adds (or replaces) a module for a network registered at runtime; predefined symbols are kept. */
    register: (symbol: NetworkSymbol, networkModule: SuiteCommonNetworkModule) => void;
    unregister: (symbol: NetworkSymbol) => void;
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

    const predefinedNetworks: ReadonlySet<NetworkSymbol> = new Set(
        networkModuleByNetworkSymbol.keys(),
    );
    // Mutated in place on (un)registration, so references handed out by getSupportedNetworks stay current.
    const supportedNetworks = Array.from(networkModuleByNetworkSymbol.keys());

    const assertNotPredefined = (symbol: NetworkSymbol) => {
        if (predefinedNetworks.has(symbol)) {
            throw new Error(`Network ${symbol} is predefined and cannot be changed at runtime.`);
        }
    };

    return {
        get: (symbol: NetworkSymbol): SuiteCommonNetworkModule => {
            const networkModule = networkModuleByNetworkSymbol.get(symbol);

            if (!networkModule) {
                throw new Error(`Network module for ${symbol} is not registered.`);
            }

            return networkModule;
        },
        getSupportedNetworks: (): readonly NetworkSymbol[] => supportedNetworks,
        isSupportedNetwork: (symbol: string): symbol is NetworkSymbol =>
            isArrayMember(symbol, supportedNetworks),
        register: (symbol: NetworkSymbol, networkModule: SuiteCommonNetworkModule) => {
            assertNotPredefined(symbol);

            if (!networkModuleByNetworkSymbol.has(symbol)) {
                supportedNetworks.push(symbol);
            }
            networkModuleByNetworkSymbol.set(symbol, networkModule);
        },
        unregister: (symbol: NetworkSymbol) => {
            assertNotPredefined(symbol);

            const index = supportedNetworks.indexOf(symbol);

            if (index !== -1) {
                supportedNetworks.splice(index, 1);
            }
            networkModuleByNetworkSymbol.delete(symbol);
        },
    };
};

export const injectNetworkModuleRepository = (services: any): NetworkModuleRepositoryDep => ({
    networkModuleRepository: services.networks.networkModuleRepository,
});
