import { bitcoinAssets } from '@trezor/network-bitcoin-assets';
import { supportedBitcoinNetworks } from '@trezor/network-bitcoin-types';
import {
    type SuiteCommonNetworkModule,
    createNetworkModule,
} from '@trezor/network-module-suite-common-types';

import { bitcoinValidator } from './addressValidator/bitcoinAddressValidator';
import { createBitcoinIcon } from './createBitcoinIcon';
import { getAccountSyncInterval, getNetworkConfig } from './networkConfig';

export const createBitcoinSuiteCommonNetworkModule = (): SuiteCommonNetworkModule =>
    createNetworkModule(supportedBitcoinNetworks, {
        icon: createBitcoinIcon({ bitcoinAssets }),
        addressValidator: bitcoinValidator,
        getNetworkConfig,
        getAccountSyncInterval,
    });
