import type { NetworkModule } from '@trezor/network-module-suite-types';

import { stellarValidator } from './addressValidator/stellarAddressValidator';
import {
    type StellarSupportedNetwork,
    getSupportedNetwork,
    isSupportedNetwork,
} from './supportedNetworks';

export type StellarNetworkModule = NetworkModule<StellarSupportedNetwork>;

export const createStellarNetworkModule = (): StellarNetworkModule => ({
    addressValidator: stellarValidator,
    getSupportedNetwork,
    isSupportedNetwork,
});
