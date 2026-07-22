import type { NetworkModule } from '@trezor/network-module-suite-types';

import { stellarValidator } from './addressValidator/stellarAddressValidator';
import {
    type StellarNetworkSymbol,
    getSupportedNetwork,
    isSupportedNetwork,
} from './supportedNetworks';

export type StellarNetworkModule = NetworkModule<StellarNetworkSymbol>;

export const createStellarNetworkModule = (): StellarNetworkModule => ({
    addressValidator: stellarValidator,
    getSupportedNetwork,
    isSupportedNetwork,
});
