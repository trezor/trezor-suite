import type { NetworkModule } from '@network-module/suite-types';

import { rippleValidator } from './addressValidator/rippleAddressValidator';
import { type RippleSupportedCoin, getSupportedCoins, isSupportedCoin } from './supportedCoins';

export const createRippleNetworkModule = (): NetworkModule<RippleSupportedCoin> => ({
    addressValidator: rippleValidator,
    getSupportedCoins,
    isSupportedCoin,
});
