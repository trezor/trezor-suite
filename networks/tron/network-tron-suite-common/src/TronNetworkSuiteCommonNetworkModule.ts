import {
    type SuiteCommonNetworkModule,
    createNetworkModule,
} from '@trezor/network-module-suite-common-types';
import { supportedTronNetworks } from '@trezor/network-tron/constants';

import { tronIcon } from '../icons';
import { tronValidator } from './addressValidator/tronAddressValidator';
import { getAccountSyncInterval, getNetworkConfig } from './networkConfig';

export const createTronSuiteCommonNetworkModule = (): SuiteCommonNetworkModule =>
    createNetworkModule(supportedTronNetworks, {
        icon: tronIcon,
        addressValidator: tronValidator,
        getNetworkConfig,
        getAccountSyncInterval,
    });
