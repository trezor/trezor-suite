import {
    type CardanoSuiteCommonNetworkModule,
    type CardanoSuiteCommonNetworkModuleDeps,
    createCardanoSuiteCommonNetworkModule,
} from '@trezor/network-cardano-suite-common';
import { supportedCardanoNetworks } from '@trezor/network-cardano-types';
import {
    type SuiteNetworkModule,
    createNetworkModuleSuite,
} from '@trezor/network-module-suite-types';

export type CardanoSuiteNetworkModuleDeps = CardanoSuiteCommonNetworkModuleDeps;

export type CardanoSuiteNetworkModule = SuiteNetworkModule<CardanoSuiteCommonNetworkModule>;

export const createCardanoSuiteNetworkModule = (
    deps: CardanoSuiteNetworkModuleDeps,
): CardanoSuiteNetworkModule =>
    createNetworkModuleSuite(
        createCardanoSuiteCommonNetworkModule(deps),
        supportedCardanoNetworks,
        {},
    );
