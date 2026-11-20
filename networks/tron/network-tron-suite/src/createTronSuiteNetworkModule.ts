import {
    type SuiteNetworkModule,
    createNetworkModuleSuite,
} from '@trezor/network-module-suite-types';
import {
    type TronSuiteCommonNetworkModule,
    createTronSuiteCommonNetworkModule,
} from '@trezor/network-tron-suite-common';
import { supportedTronNetworks } from '@trezor/network-tron-types';

export type TronSuiteNetworkModule = SuiteNetworkModule<TronSuiteCommonNetworkModule>;

export const createTronSuiteNetworkModule = (): TronSuiteNetworkModule =>
    createNetworkModuleSuite(createTronSuiteCommonNetworkModule(), supportedTronNetworks, {});
