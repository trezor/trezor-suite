import { createBitcoinSuiteCommonNetworkModule } from '@trezor/network-bitcoin-suite-common';
import { createCardanoSuiteCommonNetworkModule } from '@trezor/network-cardano-suite-common';
import { createEthereumSuiteCommonNetworkModule } from '@trezor/network-ethereum-suite-common';
import type { NetworkSuiteCommonModuleApi } from '@trezor/network-module-suite-common-types';
import { createRippleSuiteCommonNetworkModule } from '@trezor/network-ripple-suite-common';
import { createSolanaSuiteCommonNetworkModule } from '@trezor/network-solana-suite-common';
import { createStellarSuiteCommonNetworkModule } from '@trezor/network-stellar-suite-common';
import { createTronSuiteCommonNetworkModule } from '@trezor/network-tron-suite-common';

import { type NetworkModules } from './NetworkModules';

type NetworkModulesCompositionRootDeps = NetworkSuiteCommonModuleApi;

export const createNetworkModulesCompositionRoot = (
    deps: NetworkModulesCompositionRootDeps,
): NetworkModules => {
    const networkModules: NetworkModules = [
        createBitcoinSuiteCommonNetworkModule(),
        createEthereumSuiteCommonNetworkModule(deps),
        createRippleSuiteCommonNetworkModule(),
        createCardanoSuiteCommonNetworkModule(),
        createSolanaSuiteCommonNetworkModule(),
        createStellarSuiteCommonNetworkModule(),
        createTronSuiteCommonNetworkModule(),
    ];

    return networkModules;
};
