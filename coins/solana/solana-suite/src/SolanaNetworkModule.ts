import type { NetworkModule } from '@network-module/suite-types';

import { solanaValidator } from './addressValidator/solanaAddressValidator';
import { getSupportedCoins, isSupportedCoin } from './supportedCoins';

export const createSolanaNetworkModule = (): NetworkModule => ({
    addressValidator: solanaValidator,
    getSupportedCoins,
    isSupportedCoin,
});
