import {
    type BitcoinSuiteCommonNetworkModule,
    createBitcoinSuiteCommonNetworkModule,
} from '@trezor/network-bitcoin-suite-common';
import { supportedBitcoinNetworks } from '@trezor/network-bitcoin-types';
import {
    type SuiteNativeNetworkModule,
    createNetworkModuleSuiteNative,
} from '@trezor/network-module-suite-native-types';

import { type SignVerifyDeps, createSignVerify } from './signVerify/createSignVerify';

export type BitcoinSuiteNativeNetworkModuleDeps = SignVerifyDeps;

export type BitcoinSuiteNativeNetworkModule =
    SuiteNativeNetworkModule<BitcoinSuiteCommonNetworkModule>;

export const createBitcoinSuiteNativeNetworkModule = (
    deps: BitcoinSuiteNativeNetworkModuleDeps,
): BitcoinSuiteNativeNetworkModule =>
    createNetworkModuleSuiteNative(
        createBitcoinSuiteCommonNetworkModule(),
        supportedBitcoinNetworks,
        { signVerify: createSignVerify(deps) },
    );
