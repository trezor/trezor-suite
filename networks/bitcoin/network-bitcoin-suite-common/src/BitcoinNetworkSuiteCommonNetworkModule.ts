import { bitcoinAssets } from '@trezor/network-bitcoin-assets';
import { supportedBitcoinNetworks } from '@trezor/network-bitcoin-types';
import {
    type SuiteCommonNetworkModule,
    createNetworkModule,
} from '@trezor/network-module-suite-common-types';

import { bitcoinValidator } from './addressValidator/bitcoinAddressValidator';
import { getAccountSyncInterval, getNetworkConfig } from './networkConfig';
import {
    type BitcoinMessageSignerDeps,
    createBitcoinMessageSigner,
} from './signVerify/createBitcoinMessageSigner';

type BitcoinSuiteCommonNetworkModuleDeps = BitcoinMessageSignerDeps;

export const createBitcoinSuiteCommonNetworkModule = (
    deps: BitcoinSuiteCommonNetworkModuleDeps,
): SuiteCommonNetworkModule =>
    createNetworkModule(supportedBitcoinNetworks, {
        icon: bitcoinAssets,
        addressValidator: bitcoinValidator,
        getNetworkConfig,
        getAccountSyncInterval,
        messageSigner: createBitcoinMessageSigner(deps),
    });
