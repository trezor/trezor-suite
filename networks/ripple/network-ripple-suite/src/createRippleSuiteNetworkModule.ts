import {
    type SuiteNetworkModule,
    createNetworkModuleSuite,
} from '@trezor/network-module-suite-types';
import {
    type RippleSuiteCommonNetworkModule,
    createRippleSuiteCommonNetworkModule,
} from '@trezor/network-ripple-suite-common';

export type RippleSuiteNetworkModule = SuiteNetworkModule<RippleSuiteCommonNetworkModule>;

export const createRippleSuiteNetworkModule = (): RippleSuiteNetworkModule =>
    createNetworkModuleSuite(createRippleSuiteCommonNetworkModule());
