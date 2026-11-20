import {
    type CardanoSuiteCommonNetworkModule,
    type CardanoSuiteCommonNetworkModuleDeps,
    createCardanoSuiteCommonNetworkModule,
} from '@trezor/network-cardano-suite-common';
import {
    type SuiteNetworkModule,
    createNetworkModuleSuite,
} from '@trezor/network-module-suite-types';

export type CardanoSuiteNetworkModuleDeps = CardanoSuiteCommonNetworkModuleDeps;

export type CardanoSuiteNetworkModule = SuiteNetworkModule<CardanoSuiteCommonNetworkModule>;

export const createCardanoSuiteNetworkModule = (
    deps: CardanoSuiteNetworkModuleDeps,
): CardanoSuiteNetworkModule =>
    createNetworkModuleSuite(createCardanoSuiteCommonNetworkModule(deps));
