import type { NetworkModule } from '@network-module/suite-types';

import { adaValidator } from './addressValidator/cardanoAddressValidator';
import { type CardanoSupportedCoin, getSupportedCoins, isSupportedCoin } from './supportedCoins';

export const createCardanoNetworkModule = (): NetworkModule<CardanoSupportedCoin> => ({
    addressValidator: adaValidator,
    getSupportedCoins,
    isSupportedCoin,
});
