import {
    type SuiteNativeNetworkModule,
    createNetworkModuleSuiteNative,
} from '@trezor/network-module-suite-native-types';
import {
    type RippleSuiteCommonNetworkModule,
    createRippleSuiteCommonNetworkModule,
} from '@trezor/network-ripple-suite-common';

export type RippleSuiteNativeNetworkModule =
    SuiteNativeNetworkModule<RippleSuiteCommonNetworkModule>;

export const createRippleSuiteNativeNetworkModule = (): RippleSuiteNativeNetworkModule =>
    createNetworkModuleSuiteNative(createRippleSuiteCommonNetworkModule());
