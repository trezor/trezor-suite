import type { NetworkModule } from '@network-module/suite-types';

import { stellarValidator } from './addressValidator/stellarAddressValidator';
import { type StellarSupportedCoin, getSupportedCoins, isSupportedCoin } from './supportedCoins';

export type StellarNetworkModule = NetworkModule<StellarSupportedCoin>;

export const createStellarNetworkModule = (): StellarNetworkModule => ({
    addressValidator: stellarValidator,
    getSupportedCoins,
    isSupportedCoin,
});
