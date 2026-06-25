import type { NetworkModule } from '@network-module/suite-types';

import { tronValidator } from './addressValidator/tronAddressValidator';
import { type TronSupportedCoin, getSupportedCoins, isSupportedCoin } from './supportedCoins';

export const createTronNetworkModule = (): NetworkModule<TronSupportedCoin> => ({
    addressValidator: tronValidator,
    getSupportedCoins,
    isSupportedCoin,
});
