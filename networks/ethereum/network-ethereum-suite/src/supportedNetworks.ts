import { isArrayMember } from '@trezor/utils';

export const supportedNetworks = [
    'eth',
    'pol',
    'bsc',
    'arb',
    'base',
    'op',
    'rhc',
    'avax',
    'etc',
    'tsep',
    'thod',
] as const;

export type EthereumNetworkSymbol = (typeof supportedNetworks)[number];

export const getSupportedNetwork = (): readonly EthereumNetworkSymbol[] => supportedNetworks;

export const isSupportedNetwork = (symbol: string): symbol is EthereumNetworkSymbol =>
    isArrayMember(symbol, supportedNetworks);
