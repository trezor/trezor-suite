import { isArrayMember } from '@trezor/utils';

export const supportedCoins = ['xrp', 'txrp'] as const;

export type RippleSupportedCoin = (typeof supportedCoins)[number];

export const getSupportedCoins = (): readonly RippleSupportedCoin[] => supportedCoins;

export const isSupportedCoin = (symbol: string): symbol is RippleSupportedCoin =>
    isArrayMember(symbol, supportedCoins);
