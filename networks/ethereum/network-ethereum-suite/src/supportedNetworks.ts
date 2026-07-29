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

export type EthereumSuiteNetworkSymbol = (typeof supportedNetworks)[number];

export const getSupportedNetworks = (): readonly EthereumSuiteNetworkSymbol[] => supportedNetworks;

export const isSupportedNetwork = (symbol: string): symbol is EthereumSuiteNetworkSymbol =>
    isArrayMember(symbol, supportedNetworks);
