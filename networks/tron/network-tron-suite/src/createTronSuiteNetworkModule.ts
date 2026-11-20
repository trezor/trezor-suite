import {
    type SuiteNetworkModule,
    createNetworkModuleSuite,
} from '@trezor/network-module-suite-types';
import {
    type TronSuiteCommonNetworkModule,
    createTronSuiteCommonNetworkModule,
} from '@trezor/network-tron-suite-common';

export type TronSuiteNetworkModule = SuiteNetworkModule<TronSuiteCommonNetworkModule>;

export const createTronSuiteNetworkModule = (): TronSuiteNetworkModule =>
    createNetworkModuleSuite(createTronSuiteCommonNetworkModule());
