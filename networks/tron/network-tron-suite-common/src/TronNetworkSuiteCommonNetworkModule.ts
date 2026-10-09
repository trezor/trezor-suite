import {
    type SuiteCommonNetworkModule,
    createNetworkModule,
} from '@trezor/network-module-suite-common-types';
import { tronAssets } from '@trezor/network-tron-assets';
import { supportedTronNetworks } from '@trezor/network-tron-types';

import { tronValidator } from './addressValidator/tronAddressValidator';
import { createTronIcon } from './createTronIcon';
import { getAccountSyncInterval, getNetworkConfig } from './networkConfig';

export const createTronSuiteCommonNetworkModule = (): SuiteCommonNetworkModule =>
    createNetworkModule(supportedTronNetworks, {
        icon: createTronIcon({ tronAssets }),
        addressValidator: tronValidator,
        getNetworkConfig,
        getAccountSyncInterval,
    });
