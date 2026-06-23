import type { NetworkModule } from '@network-module/suite-types';

import { rippleValidator } from './addressValidator/rippleAddressValidator';

const supportedCoins = ['xrp', 'txrp'];

const getSupportedCoins = (): string[] => supportedCoins;

const isSupportedCoin = (symbol: string): symbol is string => supportedCoins.includes(symbol);

export const createRippleNetworkModule = (): NetworkModule => ({
    addressValidator: rippleValidator,
    getSupportedCoins,
    isSupportedCoin,
});
