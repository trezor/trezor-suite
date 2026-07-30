import { createBitcoinSuiteCommonNetworkModule } from '@trezor/network-bitcoin-suite-common';
import { createCardanoSuiteCommonNetworkModule } from '@trezor/network-cardano-suite-common';
import { createEthereumSuiteCommonNetworkModule } from '@trezor/network-ethereum-suite-common';
import type { SuiteCommonNetworkModule } from '@trezor/network-module-suite-common-types';
import { createRippleSuiteCommonNetworkModule } from '@trezor/network-ripple-suite-common';
import { createSolanaSuiteCommonNetworkModule } from '@trezor/network-solana-suite-common';
import { createStellarSuiteCommonNetworkModule } from '@trezor/network-stellar-suite-common';
import { createTronSuiteCommonNetworkModule } from '@trezor/network-tron-suite-common';

export const createNetworksCompositionRoot = (): readonly SuiteCommonNetworkModule[] => {
    const networkModules: readonly SuiteCommonNetworkModule[] = [
        createBitcoinSuiteCommonNetworkModule(),
        createEthereumSuiteCommonNetworkModule(),
        createRippleSuiteCommonNetworkModule(),
        createCardanoSuiteCommonNetworkModule(),
        createSolanaSuiteCommonNetworkModule(),
        createStellarSuiteCommonNetworkModule(),
        createTronSuiteCommonNetworkModule(),
    ];

    return networkModules;
};
