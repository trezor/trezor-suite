import {
    type BitcoinSuiteNetworkModuleDeps,
    createBitcoinSuiteNetworkModule,
} from '@trezor/network-bitcoin-suite';
import {
    type CardanoSuiteNetworkModuleDeps,
    createCardanoSuiteNetworkModule,
} from '@trezor/network-cardano-suite';
import {
    type EthereumSuiteNetworkModuleDeps,
    createEthereumSuiteNetworkModule,
} from '@trezor/network-ethereum-suite';
import { type SuiteNetworkModuleRepositoryDep } from '@trezor/network-module-suite-types';
import { createRippleSuiteNetworkModule } from '@trezor/network-ripple-suite';
import { createSolanaSuiteNetworkModule } from '@trezor/network-solana-suite';
import { createStellarSuiteNetworkModule } from '@trezor/network-stellar-suite';
import { createTronSuiteNetworkModule } from '@trezor/network-tron-suite';

import { createSuiteNetworkModuleRepository } from './SuiteNetworkModuleRepository';

type SuiteNetworksCompositionRootDeps = BitcoinSuiteNetworkModuleDeps &
    CardanoSuiteNetworkModuleDeps &
    EthereumSuiteNetworkModuleDeps;

export const createSuiteNetworksCompositionRoot = (
    deps: SuiteNetworksCompositionRootDeps,
): SuiteNetworkModuleRepositoryDep => ({
    suiteNetworkModuleRepository: createSuiteNetworkModuleRepository({
        suiteNetworkModules: {
            bitcoin: createBitcoinSuiteNetworkModule(deps),
            ethereum: createEthereumSuiteNetworkModule(deps),
            cardano: createCardanoSuiteNetworkModule(deps),
            ripple: createRippleSuiteNetworkModule(),
            solana: createSolanaSuiteNetworkModule(),
            stellar: createStellarSuiteNetworkModule(),
            tron: createTronSuiteNetworkModule(),
        },
    }),
});
