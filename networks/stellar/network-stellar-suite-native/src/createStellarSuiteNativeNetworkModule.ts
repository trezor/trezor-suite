import {
    type SuiteNativeNetworkModule,
    createNetworkModuleSuiteNative,
} from '@trezor/network-module-suite-native-types';
import {
    type StellarSuiteCommonNetworkModule,
    createStellarSuiteCommonNetworkModule,
} from '@trezor/network-stellar-suite-common';

export type StellarSuiteNativeNetworkModule =
    SuiteNativeNetworkModule<StellarSuiteCommonNetworkModule>;

export const createStellarSuiteNativeNetworkModule = (): StellarSuiteNativeNetworkModule =>
    createNetworkModuleSuiteNative(createStellarSuiteCommonNetworkModule());
