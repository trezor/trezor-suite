import type { NetworkModule } from '@network-module/suite-types';

import { adaValidator } from './addressValidator/cardanoAddressValidator';

const supportedCoins = ['ada'];

const getSupportedCoins = (): string[] => supportedCoins;

const isSupportedCoin = (symbol: string): symbol is string => supportedCoins.includes(symbol);

export const createCardanoNetworkModule = (): NetworkModule => ({
    addressValidator: adaValidator,
    getSupportedCoins,
    isSupportedCoin,
});
