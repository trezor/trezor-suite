import {
    type SuiteCommonNetworkModule,
    createNetworkModule,
} from '@trezor/network-module-suite-common-types';
import { supportedTronNetworks } from '@trezor/network-tron-types';

import { tronValidator } from './addressValidator/tronAddressValidator';
import { getAccountSyncInterval, getNetworkConfig } from './networkConfig';

export const createTronSuiteCommonNetworkModule = (): SuiteCommonNetworkModule =>
    createNetworkModule(supportedTronNetworks, {
        addressValidator: tronValidator,
        getNetworkConfig,
        getAccountSyncInterval,
    });
