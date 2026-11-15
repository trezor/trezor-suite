import { bitcoinAssets } from '@trezor/network-bitcoin-assets';
import { supportedBitcoinNetworks } from '@trezor/network-bitcoin-types';
import {
    type SuiteCommonNetworkModule,
    createNetworkModule,
} from '@trezor/network-module-suite-common-types';

import { bitcoinValidator } from './addressValidator/bitcoinAddressValidator';
import { getAccountSyncInterval, getNetworkConfig } from './networkConfig';
import {
    type BitcoinSignVerifyDeps,
    createBitcoinSignVerify,
} from './signVerify/createBitcoinSignVerify';

export type BitcoinSuiteCommonNetworkModuleDeps = BitcoinSignVerifyDeps;

export type BitcoinSuiteCommonNetworkModule = SuiteCommonNetworkModule;

export const createBitcoinSuiteCommonNetworkModule = (
    deps: BitcoinSuiteCommonNetworkModuleDeps,
): BitcoinSuiteCommonNetworkModule =>
    createNetworkModule(supportedBitcoinNetworks, {
        icon: bitcoinAssets,
        addressValidator: bitcoinValidator,
        getNetworkConfig,
        getAccountSyncInterval,
        signVerify: createBitcoinSignVerify(deps),
    });
