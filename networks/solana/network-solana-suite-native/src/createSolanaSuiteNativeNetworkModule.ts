import {
    type SuiteNativeNetworkModule,
    createNetworkModuleSuiteNative,
} from '@trezor/network-module-suite-native-types';
import {
    type SolanaSuiteCommonNetworkModule,
    createSolanaSuiteCommonNetworkModule,
} from '@trezor/network-solana-suite-common';

export type SolanaSuiteNativeNetworkModule =
    SuiteNativeNetworkModule<SolanaSuiteCommonNetworkModule>;

export const createSolanaSuiteNativeNetworkModule = (): SolanaSuiteNativeNetworkModule =>
    createNetworkModuleSuiteNative(createSolanaSuiteCommonNetworkModule());
