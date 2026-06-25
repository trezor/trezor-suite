import { isArrayMember } from '@trezor/utils';

export const supportedCoins = ['trx', 'ttrx'] as const;

export type TronSupportedCoin = (typeof supportedCoins)[number];

export const getSupportedCoins = (): readonly TronSupportedCoin[] => supportedCoins;

export const isSupportedCoin = (symbol: string): symbol is TronSupportedCoin =>
    isArrayMember(symbol, supportedCoins);
