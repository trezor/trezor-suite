import {
    type BitcoinSuiteCommonNetworkModule,
    type BitcoinSuiteCommonNetworkModuleDeps,
    createBitcoinSuiteCommonNetworkModule,
} from '@trezor/network-bitcoin-suite-common';
import {
    type SuiteNativeNetworkModule,
    createNetworkModuleSuiteNative,
} from '@trezor/network-module-suite-native-types';

export type BitcoinSuiteNativeNetworkModuleDeps = BitcoinSuiteCommonNetworkModuleDeps;

export type BitcoinSuiteNativeNetworkModule =
    SuiteNativeNetworkModule<BitcoinSuiteCommonNetworkModule>;

export const createBitcoinSuiteNativeNetworkModule = (
    deps: BitcoinSuiteNativeNetworkModuleDeps,
): BitcoinSuiteNativeNetworkModule =>
    createNetworkModuleSuiteNative(createBitcoinSuiteCommonNetworkModule(deps));
