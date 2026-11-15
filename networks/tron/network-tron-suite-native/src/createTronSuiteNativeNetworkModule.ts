import {
    type SuiteNativeNetworkModule,
    createNetworkModuleSuiteNative,
} from '@trezor/network-module-suite-native-types';
import {
    type TronSuiteCommonNetworkModule,
    createTronSuiteCommonNetworkModule,
} from '@trezor/network-tron-suite-common';

export type TronSuiteNativeNetworkModule = SuiteNativeNetworkModule<TronSuiteCommonNetworkModule>;

export const createTronSuiteNativeNetworkModule = (): TronSuiteNativeNetworkModule =>
    createNetworkModuleSuiteNative(createTronSuiteCommonNetworkModule());
