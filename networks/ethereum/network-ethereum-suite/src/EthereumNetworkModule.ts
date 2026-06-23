import type { NetworkModule } from '@network-module/suite-types';

import { ethereumValidator } from './addressValidator/ethereumAddressValidator';
import { getSupportedCoins, isSupportedCoin } from './supportedCoins';

export const createEthereumNetworkModule = (): NetworkModule => ({
    addressValidator: ethereumValidator,
    getSupportedCoins,
    isSupportedCoin,
});
