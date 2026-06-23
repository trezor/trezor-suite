import type { NetworkModule } from '@network-module/suite-types';

import { tronValidator } from './addressValidator/tronAddressValidator';

const supportedCoins = ['trx', 'ttrx'];

const getSupportedCoins = (): string[] => supportedCoins;

const isSupportedCoin = (symbol: string): symbol is string => supportedCoins.includes(symbol);

export const createTronNetworkModule = (): NetworkModule => ({
    addressValidator: tronValidator,
    getSupportedCoins,
    isSupportedCoin,
});
