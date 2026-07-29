import type { SuiteCommonNetworkModule } from '@trezor/network-module-suite-common-types';

import { stellarValidator } from './addressValidator/stellarAddressValidator';
import {
    type StellarNetworkSymbol,
    getSupportedNetworks,
    isSupportedNetwork,
} from './supportedNetworks';

export type StellarNetworkSuiteCommonNetworkModule = SuiteCommonNetworkModule<StellarNetworkSymbol>;

export const createStellarSuiteCommonNetworkModule =
    (): StellarNetworkSuiteCommonNetworkModule => ({
        addressValidator: stellarValidator,
        getSupportedNetworks,
        isSupportedNetwork,
    });
