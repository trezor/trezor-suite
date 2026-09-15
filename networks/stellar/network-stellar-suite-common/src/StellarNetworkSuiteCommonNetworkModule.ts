import {
    type SuiteCommonNetworkModule,
    createNetworkModule,
} from '@trezor/network-module-suite-common-types';
import { supportedStellarNetworks } from '@trezor/network-stellar/constants';

import { stellarIcon } from '../icons';
import { stellarValidator } from './addressValidator/stellarAddressValidator';
import { getAccountSyncInterval, getNetworkConfig } from './networkConfig';

export const createStellarSuiteCommonNetworkModule = (): SuiteCommonNetworkModule =>
    createNetworkModule(supportedStellarNetworks, {
        icon: stellarIcon,
        addressValidator: stellarValidator,
        getNetworkConfig,
        getAccountSyncInterval,
    });
