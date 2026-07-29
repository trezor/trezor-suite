import type { NetworkModule } from '@trezor/network-module-suite-types';

import { stellarValidator } from './addressValidator/stellarAddressValidator';
import {
    type StellarNetworkSymbol,
    getSupportedNetworks,
    isSupportedNetwork,
} from './supportedNetworks';

export type StellarNetworkSuiteCommonNetworkModule = NetworkModule<StellarNetworkSymbol>;

export const createStellarSuiteCommonNetworkModule =
    (): StellarNetworkSuiteCommonNetworkModule => ({
        addressValidator: stellarValidator,
        getSupportedNetworks,
        isSupportedNetwork,
    });
