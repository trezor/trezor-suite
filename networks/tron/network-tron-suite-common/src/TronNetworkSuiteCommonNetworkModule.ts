import {
    type SuiteCommonNetworkModule,
    createNetworkModule,
} from '@trezor/network-module-suite-common-types';
import { supportedTronNetworks } from '@trezor/network-tron/constants';

import { tronValidator } from './addressValidator/tronAddressValidator';
import { getNetworkConfig } from './networkConfig';

export const createTronSuiteCommonNetworkModule = (): SuiteCommonNetworkModule =>
    createNetworkModule(supportedTronNetworks, {
        addressValidator: tronValidator,
        getNetworkConfig,
    });
