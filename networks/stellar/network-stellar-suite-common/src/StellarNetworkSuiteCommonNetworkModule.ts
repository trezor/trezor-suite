import {
    type SuiteCommonNetworkModule,
    createNetworkModule,
} from '@trezor/network-module-suite-common-types';
import { stellarAssets } from '@trezor/network-stellar-assets';
import { supportedStellarNetworks } from '@trezor/network-stellar-types';

import { stellarValidator } from './addressValidator/stellarAddressValidator';
import { createStellarIcon } from './createStellarIcon';
import { getStellarTokenLogoAddresses } from './getStellarTokenLogoAddresses';
import { getAccountSyncInterval, getNetworkConfig } from './networkConfig';

export const createStellarSuiteCommonNetworkModule = (): SuiteCommonNetworkModule =>
    createNetworkModule(supportedStellarNetworks, {
        icon: createStellarIcon({ stellarAssets, getStellarTokenLogoAddresses }),
        addressValidator: stellarValidator,
        getNetworkConfig,
        getAccountSyncInterval,
    });
