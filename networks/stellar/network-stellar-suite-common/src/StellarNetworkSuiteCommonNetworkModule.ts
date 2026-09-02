import type { SuiteCommonNetworkModule } from '@trezor/network-module-suite-common-types';
import {
    type StellarNetworkSymbol,
    isSupportedStellarNetwork,
    supportedStellarNetworks,
} from '@trezor/network-stellar/constants';

import { stellarValidator } from './addressValidator/stellarAddressValidator';
import { getNetworkConfig } from './networkConfig';

export type StellarNetworkSuiteCommonNetworkModule = SuiteCommonNetworkModule<StellarNetworkSymbol>;

export const createStellarSuiteCommonNetworkModule =
    (): StellarNetworkSuiteCommonNetworkModule => ({
        addressValidator: stellarValidator,
        getSupportedNetworks: () => supportedStellarNetworks,
        isSupportedNetwork: isSupportedStellarNetwork,
        getNetworkConfig,
    });
