import {
    type SuiteNetworkModule,
    createNetworkModuleSuite,
} from '@trezor/network-module-suite-types';
import {
    type StellarSuiteCommonNetworkModule,
    createStellarSuiteCommonNetworkModule,
} from '@trezor/network-stellar-suite-common';

export type StellarSuiteNetworkModule = SuiteNetworkModule<StellarSuiteCommonNetworkModule>;

export const createStellarSuiteNetworkModule = (): StellarSuiteNetworkModule =>
    createNetworkModuleSuite(createStellarSuiteCommonNetworkModule());
