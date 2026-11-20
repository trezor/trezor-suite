import {
    type EthereumSuiteCommonNetworkModule,
    type EthereumSuiteCommonNetworkModuleDeps,
    createEthereumSuiteCommonNetworkModule,
} from '@trezor/network-ethereum-suite-common';
import {
    type SuiteNetworkModule,
    createNetworkModuleSuite,
} from '@trezor/network-module-suite-types';

export type EthereumSuiteNetworkModuleDeps = EthereumSuiteCommonNetworkModuleDeps;

export type EthereumSuiteNetworkModule = SuiteNetworkModule<EthereumSuiteCommonNetworkModule>;

export const createEthereumSuiteNetworkModule = (
    deps: EthereumSuiteNetworkModuleDeps,
): EthereumSuiteNetworkModule =>
    createNetworkModuleSuite(createEthereumSuiteCommonNetworkModule(deps));
