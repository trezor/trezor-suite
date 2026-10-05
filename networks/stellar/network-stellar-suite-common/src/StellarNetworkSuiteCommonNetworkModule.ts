import {
    type SuiteCommonNetworkModule,
    createNetworkModule,
} from '@trezor/network-module-suite-common-types';
import { supportedStellarNetworks } from '@trezor/network-stellar-types';

import { stellarValidator } from './addressValidator/stellarAddressValidator';
import { getAccountSyncInterval, getNetworkConfig } from './networkConfig';

export const createStellarSuiteCommonNetworkModule = (): SuiteCommonNetworkModule =>
    createNetworkModule(supportedStellarNetworks, {
        addressValidator: stellarValidator,
        getNetworkConfig,
        getAccountSyncInterval,
    });
