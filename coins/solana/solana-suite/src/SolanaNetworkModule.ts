import type { NetworkModule } from '@network-module/suite-types';

import { solanaValidator } from './addressValidator/solanaAddressValidator';

const supportedCoins = ['sol', 'dsol'];

const getSupportedCoins = (): string[] => supportedCoins;

const isSupportedCoin = (symbol: string): symbol is string => supportedCoins.includes(symbol);

export const createSolanaNetworkModule = (): NetworkModule => ({
    addressValidator: solanaValidator,
    getSupportedCoins,
    isSupportedCoin,
});
