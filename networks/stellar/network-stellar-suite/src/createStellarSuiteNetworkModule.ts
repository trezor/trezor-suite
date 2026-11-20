import {
    type SuiteNetworkModule,
    createNetworkModuleSuite,
} from '@trezor/network-module-suite-types';
import {
    type StellarSuiteCommonNetworkModule,
    createStellarSuiteCommonNetworkModule,
} from '@trezor/network-stellar-suite-common';
import { supportedStellarNetworks } from '@trezor/network-stellar-types';

export type StellarSuiteNetworkModule = SuiteNetworkModule<StellarSuiteCommonNetworkModule>;

export const createStellarSuiteNetworkModule = (): StellarSuiteNetworkModule =>
    createNetworkModuleSuite(createStellarSuiteCommonNetworkModule(), supportedStellarNetworks, {});
