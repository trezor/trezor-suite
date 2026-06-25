import { isArrayMember } from '@trezor/utils';

export const supportedCoins = ['xlm', 'txlm'] as const;

export type StellarSupportedCoin = (typeof supportedCoins)[number];

export const getSupportedCoins = (): readonly StellarSupportedCoin[] => supportedCoins;

export const isSupportedCoin = (symbol: string): symbol is StellarSupportedCoin =>
    isArrayMember(symbol, supportedCoins);
