import type { NetworkModule } from '@network-module/suite-types';

import { bitcoinValidator } from './addressValidator/bitcoinAddressValidator';
import { type BitcoinSupportedCoin, getSupportedCoins, isSupportedCoin } from './supportedCoins';

export const createBitcoinNetworkModule = (): NetworkModule<BitcoinSupportedCoin> => ({
    addressValidator: bitcoinValidator,
    getSupportedCoins,
    isSupportedCoin,
});
