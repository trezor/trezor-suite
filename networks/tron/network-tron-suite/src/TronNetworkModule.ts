import type { NetworkModule } from '@network-module/suite-types';

import { tronValidator } from './addressValidator/tronAddressValidator';
import { getSupportedCoins, isSupportedCoin } from './supportedCoins';

export const createTronNetworkModule = (): NetworkModule => ({
    addressValidator: tronValidator,
    getSupportedCoins,
    isSupportedCoin,
});
