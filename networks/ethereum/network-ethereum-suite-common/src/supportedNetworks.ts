import { isArrayMember } from '@trezor/utils';

export const supportedNetworks = [
    'eth',
    'pol',
    'bsc',
    'arb',
    'base',
    'op',
    'rhc',
    'hype',
    'avax',
    'etc',
    'tsep',
    'thod',
] as const;

export type EthereumNetworkSymbol = (typeof supportedNetworks)[number];

export const getSupportedNetworks = (): readonly EthereumNetworkSymbol[] => supportedNetworks;

export const isSupportedNetwork = (symbol: string): symbol is EthereumNetworkSymbol =>
    isArrayMember(symbol, supportedNetworks);
