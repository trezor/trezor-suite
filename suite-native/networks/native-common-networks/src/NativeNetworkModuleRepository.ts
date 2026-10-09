import type { NetworkSymbol } from '@suite-common/networks';
import type { SuiteNativeNetworkModule } from '@suite-native/network-module-suite-native-types';

import type { NativeNetworkModules } from './createNativeModulesCompositionRoot';

export type NativeNetworkModuleRepository = {
    get: (networkSymbol: NetworkSymbol) => SuiteNativeNetworkModule | undefined;
};

export const createNativeNetworkModuleRepository = (
    networkModules: NativeNetworkModules,
): NativeNetworkModuleRepository => {
    const networkModuleByNetworkSymbol = new Map<NetworkSymbol, SuiteNativeNetworkModule>();

    networkModules.forEach(networkModule => {
        networkModule.getSupportedNetworks().forEach(networkSymbol => {
            if (networkModuleByNetworkSymbol.has(networkSymbol)) {
                throw new Error(
                    `Native network module for "${networkSymbol}" is already registered.`,
                );
            }

            networkModuleByNetworkSymbol.set(networkSymbol, networkModule);
        });
    });

    return {
        get: networkSymbol => networkModuleByNetworkSymbol.get(networkSymbol),
    };
};
