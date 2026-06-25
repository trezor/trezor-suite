import { isArrayMember } from '@trezor/utils';

export const supportedCoins = ['btc', 'test', 'regtest', 'ltc', 'doge', 'zec', 'bch'] as const;

export type BitcoinSupportedCoin = (typeof supportedCoins)[number];

export const getSupportedCoins = (): readonly BitcoinSupportedCoin[] => supportedCoins;

export const isSupportedCoin = (symbol: string): symbol is BitcoinSupportedCoin =>
    isArrayMember(symbol, supportedCoins);
