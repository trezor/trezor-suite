import type { NetworkModule } from '@network-module/suite-types';

import { adaValidator } from './addressValidator/cardanoAddressValidator';
import { getSupportedCoins, isSupportedCoin } from './supportedCoins';

export const createCardanoNetworkModule = (): NetworkModule => ({
    addressValidator: adaValidator,
    getSupportedCoins,
    isSupportedCoin,
});
