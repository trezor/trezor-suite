import { type NetworkModule, openNetworkModule } from '@trezor/network-module-suite-common-types';

import type { SuiteNativeNetworkModule } from './SuiteNativeNetworkModule';

/** Opens a network module for the app root's repositories, which pass the open `NetworkSymbol`. */
export const openSuiteNativeNetworkModule = <TNetworkSymbol extends string>(
    networkModule: SuiteNativeNetworkModule<NetworkModule<TNetworkSymbol>>,
): SuiteNativeNetworkModule => {
    const common = openNetworkModule(networkModule.getCommon());

    return {
        getSupportedNetworks: networkModule.getSupportedNetworks,
        getCommon: () => common,
    };
};
