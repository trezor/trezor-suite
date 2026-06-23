import type { NetworkModule } from '@network-module/suite-types';

import { ethereumValidator } from './addressValidator/ethereumAddressValidator';

const supportedCoins = ['eth', 'pol', 'bsc', 'arb', 'base', 'op', 'avax', 'etc', 'tsep', 'thod'];

const getSupportedCoins = (): string[] => supportedCoins;

const isSupportedCoin = (symbol: string): symbol is string => supportedCoins.includes(symbol);

export const createEthereumNetworkModule = (): NetworkModule => ({
    addressValidator: ethereumValidator,
    getSupportedCoins,
    isSupportedCoin,
});
