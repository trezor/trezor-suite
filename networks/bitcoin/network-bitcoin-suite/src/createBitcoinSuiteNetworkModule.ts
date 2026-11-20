import {
    type BitcoinSuiteCommonNetworkModule,
    type BitcoinSuiteCommonNetworkModuleDeps,
    createBitcoinSuiteCommonNetworkModule,
} from '@trezor/network-bitcoin-suite-common';
import { supportedBitcoinNetworks } from '@trezor/network-bitcoin-types';
import {
    type SuiteNetworkModule,
    createNetworkModuleSuite,
} from '@trezor/network-module-suite-types';

export type BitcoinSuiteNetworkModuleDeps = BitcoinSuiteCommonNetworkModuleDeps;

export type BitcoinSuiteNetworkModule = SuiteNetworkModule<BitcoinSuiteCommonNetworkModule>;

export const createBitcoinSuiteNetworkModule = (
    deps: BitcoinSuiteNetworkModuleDeps,
): BitcoinSuiteNetworkModule =>
    createNetworkModuleSuite(
        createBitcoinSuiteCommonNetworkModule(deps),
        supportedBitcoinNetworks,
        {},
    );
