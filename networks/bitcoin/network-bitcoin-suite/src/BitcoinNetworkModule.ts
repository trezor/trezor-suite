import type { NetworkModule } from '@network-module/suite-types';

import { bitcoinValidator } from './addressValidator/bitcoinAddressValidator';

const supportedCoins = ['btc', 'test', 'regtest', 'ltc', 'doge', 'zec', 'bch'];

const getSupportedCoins = (): string[] => supportedCoins;

const isSupportedCoin = (symbol: string): symbol is string => supportedCoins.includes(symbol);

export const createBitcoinNetworkModule = (): NetworkModule => ({
    addressValidator: bitcoinValidator,
    getSupportedCoins,
    isSupportedCoin,
});
