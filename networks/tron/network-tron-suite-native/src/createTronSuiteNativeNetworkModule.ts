import {
    type SuiteNativeNetworkModule,
    createNetworkModuleSuiteNative,
} from '@trezor/network-module-suite-native-types';
import {
    type TronSuiteCommonNetworkModule,
    createTronSuiteCommonNetworkModule,
} from '@trezor/network-tron-suite-common';
import { supportedTronNetworks } from '@trezor/network-tron-types';

export type TronSuiteNativeNetworkModule = SuiteNativeNetworkModule<TronSuiteCommonNetworkModule>;

export const createTronSuiteNativeNetworkModule = (): TronSuiteNativeNetworkModule =>
    createNetworkModuleSuiteNative(createTronSuiteCommonNetworkModule(), supportedTronNetworks, {});
