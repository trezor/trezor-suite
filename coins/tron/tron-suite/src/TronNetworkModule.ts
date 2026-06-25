import type { NetworkModule } from '@network-module/suite-types';

import { tronValidator } from './addressValidator/tronAddressValidator';
import { type TronSupportedCoin, getSupportedCoins, isSupportedCoin } from './supportedCoins';

export type TronNetworkModule = NetworkModule<TronSupportedCoin>;

export const createTronNetworkModule = (): TronNetworkModule => ({
    addressValidator: tronValidator,
    getSupportedCoins,
    isSupportedCoin,
});
