import type { NetworkModule } from '@trezor/network-module-suite-types';

import { stellarValidator } from './addressValidator/stellarAddressValidator';
import {
    type StellarNetworkSymbol,
    getSupportedNetworks,
    isSupportedNetwork,
} from './supportedNetworks';

export type StellarNetworkModule = NetworkModule<StellarNetworkSymbol>;

export const createStellarNetworkModule = (): StellarNetworkModule => ({
    addressValidator: stellarValidator,
    getSupportedNetworks,
    isSupportedNetwork,
});
