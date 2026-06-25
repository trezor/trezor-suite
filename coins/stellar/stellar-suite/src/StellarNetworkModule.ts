import type { NetworkModule } from '@network-module/suite-types';

import { stellarValidator } from './addressValidator/stellarAddressValidator';
import { type StellarSupportedCoin, getSupportedCoins, isSupportedCoin } from './supportedCoins';

export const createStellarNetworkModule = (): NetworkModule<StellarSupportedCoin> => ({
    addressValidator: stellarValidator,
    getSupportedCoins,
    isSupportedCoin,
});
