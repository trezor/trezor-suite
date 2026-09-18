import { createBitcoinSuiteCommonNetworkModule } from '@trezor/network-bitcoin-suite-common/runtime';
import { createCardanoSuiteCommonNetworkModule } from '@trezor/network-cardano-suite-common/runtime';
import { createEthereumSuiteCommonNetworkModule } from '@trezor/network-ethereum-suite-common/runtime';
import type { NetworkSuiteCommonModuleApi } from '@trezor/network-module-suite-common-types';
import { createRippleSuiteCommonNetworkModule } from '@trezor/network-ripple-suite-common/runtime';
import { createSolanaSuiteCommonNetworkModule } from '@trezor/network-solana-suite-common/runtime';
import { createStellarSuiteCommonNetworkModule } from '@trezor/network-stellar-suite-common/runtime';
import { createTronSuiteCommonNetworkModule } from '@trezor/network-tron-suite-common/runtime';

import { type NetworkModules } from './NetworkModules';

type NetworkModulesCompositionRootDeps = NetworkSuiteCommonModuleApi;

export const createNetworkModulesCompositionRoot = (
    deps: NetworkModulesCompositionRootDeps,
): NetworkModules => {
    // When adding a new Network Module, you have to
    //    1. register it here to have the runtime object for DI
    //    2. and in the `NetworkModules` to have static typings right
    const networkModules: NetworkModules = {
        bitcoin: createBitcoinSuiteCommonNetworkModule(),
        ethereum: createEthereumSuiteCommonNetworkModule(deps),
        ripple: createRippleSuiteCommonNetworkModule(),
        cardano: createCardanoSuiteCommonNetworkModule(),
        solana: createSolanaSuiteCommonNetworkModule(),
        stellar: createStellarSuiteCommonNetworkModule(),
        tron: createTronSuiteCommonNetworkModule(),
    };

    return networkModules;
};
