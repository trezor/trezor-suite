import type { NetworkModule } from '@network-module/suite-types';

import { rippleValidator } from './addressValidator/rippleAddressValidator';
import { getSupportedCoins, isSupportedCoin } from './supportedCoins';

export const createRippleNetworkModule = (): NetworkModule => ({
    addressValidator: rippleValidator,
    getSupportedCoins,
    isSupportedCoin,
});
