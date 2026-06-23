import type { NetworkModule } from '@network-module/suite-types';

import { bitcoinValidator } from './addressValidator/bitcoinAddressValidator';
import { getSupportedCoins, isSupportedCoin } from './supportedCoins';

export const createBitcoinNetworkModule = (): NetworkModule => ({
    addressValidator: bitcoinValidator,
    getSupportedCoins,
    isSupportedCoin,
});
