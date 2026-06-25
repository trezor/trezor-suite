import { isArrayMember } from '@trezor/utils';

export const supportedCoins = ['ada'] as const;

export type CardanoSupportedCoin = (typeof supportedCoins)[number];

export const getSupportedCoins = (): readonly CardanoSupportedCoin[] => supportedCoins;

export const isSupportedCoin = (symbol: string): symbol is CardanoSupportedCoin =>
    isArrayMember(symbol, supportedCoins);
