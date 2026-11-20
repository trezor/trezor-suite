import {
    type SuiteNativeNetworkModule,
    createNetworkModuleSuiteNative,
} from '@trezor/network-module-suite-native-types';
import {
    type StellarSuiteCommonNetworkModule,
    createStellarSuiteCommonNetworkModule,
} from '@trezor/network-stellar-suite-common';
import { supportedStellarNetworks } from '@trezor/network-stellar-types';

export type StellarSuiteNativeNetworkModule =
    SuiteNativeNetworkModule<StellarSuiteCommonNetworkModule>;

export const createStellarSuiteNativeNetworkModule = (): StellarSuiteNativeNetworkModule =>
    createNetworkModuleSuiteNative(
        createStellarSuiteCommonNetworkModule(),
        supportedStellarNetworks,
        {},
    );
