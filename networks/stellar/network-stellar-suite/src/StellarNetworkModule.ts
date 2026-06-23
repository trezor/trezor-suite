import type { NetworkModule } from '@network-module/suite-types';

import { stellarValidator } from './addressValidator/stellarAddressValidator';

const supportedCoins = ['xlm', 'txlm'];

const getSupportedCoins = (): string[] => supportedCoins;

const isSupportedCoin = (symbol: string): symbol is string => supportedCoins.includes(symbol);

export const createStellarNetworkModule = (): NetworkModule => ({
    addressValidator: stellarValidator,
    getSupportedCoins,
    isSupportedCoin,
});
