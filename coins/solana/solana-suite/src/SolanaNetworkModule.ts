import type { NetworkModule } from '@network-module/suite-types';

import { solanaValidator } from './addressValidator/solanaAddressValidator';
import { type SolanaSupportedCoin, getSupportedCoins, isSupportedCoin } from './supportedCoins';

export const createSolanaNetworkModule = (): NetworkModule<SolanaSupportedCoin> => ({
    addressValidator: solanaValidator,
    getSupportedCoins,
    isSupportedCoin,
});
