import type { NetworkModule } from '@network-module/suite-types';

import { adaValidator } from './addressValidator/cardanoAddressValidator';
import { type CardanoSupportedCoin, getSupportedCoins, isSupportedCoin } from './supportedCoins';

export type CardanoNetworkModule = NetworkModule<CardanoSupportedCoin>;

export const createCardanoNetworkModule = (): CardanoNetworkModule => ({
    addressValidator: adaValidator,
    getSupportedCoins,
    isSupportedCoin,
});
