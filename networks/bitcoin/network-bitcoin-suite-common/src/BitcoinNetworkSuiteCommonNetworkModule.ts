import { supportedBitcoinNetworks } from '@trezor/network-bitcoin/constants';
import {
    type SuiteCommonNetworkModule,
    createNetworkModule,
} from '@trezor/network-module-suite-common-types';

import { bitcoinValidator } from './addressValidator/bitcoinAddressValidator';
import { getNetworkConfig } from './networkConfig';

export const createBitcoinSuiteCommonNetworkModule = (): SuiteCommonNetworkModule =>
    createNetworkModule(supportedBitcoinNetworks, {
        addressValidator: bitcoinValidator,
        getNetworkConfig,
    });
