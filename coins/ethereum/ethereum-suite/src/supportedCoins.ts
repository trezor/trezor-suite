import { isArrayMember } from '@trezor/utils';

export const supportedCoins = [
    'eth',
    'pol',
    'bsc',
    'arb',
    'base',
    'op',
    'avax',
    'etc',
    'tsep',
    'thod',
] as const;

export type EthereumSupportedCoin = (typeof supportedCoins)[number];

export const getSupportedCoins = (): readonly EthereumSupportedCoin[] => supportedCoins;

export const isSupportedCoin = (symbol: string): symbol is EthereumSupportedCoin =>
    isArrayMember(symbol, supportedCoins);
