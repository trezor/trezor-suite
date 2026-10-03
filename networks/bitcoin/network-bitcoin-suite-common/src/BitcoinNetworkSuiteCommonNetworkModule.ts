import { supportedBitcoinNetworks } from '@trezor/network-bitcoin/constants';
import {
    type SuiteCommonNetworkModule,
    createNetworkModule,
} from '@trezor/network-module-suite-common-types';

import { bitcoinIcon } from '../icons';
import { bitcoinValidator } from './addressValidator/bitcoinAddressValidator';
import { getAccountSyncInterval, getNetworkConfig } from './networkConfig';

export const createBitcoinSuiteCommonNetworkModule = (): SuiteCommonNetworkModule =>
    createNetworkModule(supportedBitcoinNetworks, {
        icon: bitcoinIcon,
        addressValidator: bitcoinValidator,
        getNetworkConfig,
        getAccountSyncInterval,
    });
