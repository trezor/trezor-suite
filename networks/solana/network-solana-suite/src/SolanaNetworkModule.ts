import type { NetworkModule } from '@trezor/network-module-suite-types';

import { solanaValidator } from './addressValidator/solanaAddressValidator';
import { type SolanaSupportedCoin, getSupportedCoins, isSupportedCoin } from './supportedCoins';

export type SolanaNetworkModule = NetworkModule<SolanaSupportedCoin>;

export const createSolanaNetworkModule = (): SolanaNetworkModule => ({
    addressValidator: solanaValidator,
    getSupportedCoins,
    isSupportedCoin,
});
