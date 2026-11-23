import { type NetworkModule, openNetworkModule } from '@trezor/network-module-suite-common-types';

import type { SuiteNetworkModule } from './SuiteNetworkModule';

/** Opens a network module for the app root's repositories, which pass the open `NetworkSymbol`. */
export const openSuiteNetworkModule = <TNetworkSymbol extends string>(
    networkModule: SuiteNetworkModule<NetworkModule<TNetworkSymbol>>,
): SuiteNetworkModule => {
    const common = openNetworkModule(networkModule.getCommon());

    return {
        getSupportedNetworks: networkModule.getSupportedNetworks,
        getCommon: () => common,
    };
};
