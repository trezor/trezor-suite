import {
    type SuiteCommonNetworkModule,
    createNetworkModule,
} from '@trezor/network-module-suite-common-types';
import {
    isSupportedStellarNetwork,
    supportedStellarNetworks,
} from '@trezor/network-stellar/constants';

import { stellarValidator } from './addressValidator/stellarAddressValidator';
import { getNetworkConfig } from './networkConfig';

export const createStellarSuiteCommonNetworkModule = (): SuiteCommonNetworkModule =>
    createNetworkModule(isSupportedStellarNetwork, {
        supportedNetworks: supportedStellarNetworks,
        addressValidator: stellarValidator,
        getNetworkConfig,
    });
