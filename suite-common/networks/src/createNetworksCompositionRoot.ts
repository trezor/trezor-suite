import { createBitcoinSuiteCommonNetworkModule } from '@trezor/network-bitcoin-suite-common';
import { createCardanoSuiteCommonNetworkModule } from '@trezor/network-cardano-suite-common';
import { createEthereumSuiteCommonNetworkModule } from '@trezor/network-ethereum-suite-common/network-module';
import { createRippleSuiteCommonNetworkModule } from '@trezor/network-ripple-suite-common';
import { createSolanaSuiteCommonNetworkModule } from '@trezor/network-solana-suite-common';
import { createStellarSuiteCommonNetworkModule } from '@trezor/network-stellar-suite-common';
import { createTronSuiteCommonNetworkModule } from '@trezor/network-tron-suite-common';

import { type NetworkModules } from './NetworkModules';

export const createNetworksCompositionRoot = (): NetworkModules => {
    // When adding a new Network Module, you have to
    //    1. register it here to have the runtime object for DI
    //    2. and in the `NetworkModules` to have static typings right
    const networkModules: NetworkModules = {
        bitcoin: createBitcoinSuiteCommonNetworkModule(),
        ethereum: createEthereumSuiteCommonNetworkModule(),
        ripple: createRippleSuiteCommonNetworkModule(),
        cardano: createCardanoSuiteCommonNetworkModule(),
        solana: createSolanaSuiteCommonNetworkModule(),
        stellar: createStellarSuiteCommonNetworkModule(),
        tron: createTronSuiteCommonNetworkModule(),
    };

    return networkModules;
};
