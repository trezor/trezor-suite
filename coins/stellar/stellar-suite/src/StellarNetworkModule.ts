import type { NetworkModule } from '@network-module/suite-types';

import { stellarValidator } from './addressValidator/stellarAddressValidator';
import { getSupportedCoins, isSupportedCoin } from './supportedCoins';

export const createStellarNetworkModule = (): NetworkModule => ({
    addressValidator: stellarValidator,
    getSupportedCoins,
    isSupportedCoin,
});
