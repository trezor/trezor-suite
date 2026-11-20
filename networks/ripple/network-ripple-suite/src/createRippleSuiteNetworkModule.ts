import {
    type SuiteNetworkModule,
    createNetworkModuleSuite,
} from '@trezor/network-module-suite-types';
import {
    type RippleSuiteCommonNetworkModule,
    createRippleSuiteCommonNetworkModule,
} from '@trezor/network-ripple-suite-common';
import { supportedRippleNetworks } from '@trezor/network-ripple-types';

export type RippleSuiteNetworkModule = SuiteNetworkModule<RippleSuiteCommonNetworkModule>;

export const createRippleSuiteNetworkModule = (): RippleSuiteNetworkModule =>
    createNetworkModuleSuite(createRippleSuiteCommonNetworkModule(), supportedRippleNetworks, {});
