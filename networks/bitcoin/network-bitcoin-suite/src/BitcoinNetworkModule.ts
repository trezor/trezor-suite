import type { NetworkModule } from '@trezor/network-module-suite-types';

import { bitcoinValidator } from './addressValidator/bitcoinAddressValidator';
import { type BitcoinSupportedCoin, getSupportedCoins, isSupportedCoin } from './supportedCoins';

export type BitcoinNetworkModule = NetworkModule<BitcoinSupportedCoin>;

export const createBitcoinNetworkModule = (): BitcoinNetworkModule => ({
    addressValidator: bitcoinValidator,
    getSupportedCoins,
    isSupportedCoin,
});
