import {
    type BitcoinSuiteCommonNetworkModule,
    type BitcoinSuiteCommonNetworkModuleDeps,
    createBitcoinSuiteCommonNetworkModule,
} from '@trezor/network-bitcoin-suite-common';
import { supportedBitcoinNetworks } from '@trezor/network-bitcoin-types';
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
    createNetworkModuleSuiteNative(
        createBitcoinSuiteCommonNetworkModule(deps),
        supportedBitcoinNetworks,
        {},
    );
