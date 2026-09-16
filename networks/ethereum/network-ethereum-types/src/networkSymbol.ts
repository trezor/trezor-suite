import { isArrayMember } from '@trezor/utils';

export const supportedEthereumNetworks = [
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
    'arc',
    'tsep',
    'thod',
    'tarc',
] as const;

export type EthereumNetworkSymbol = (typeof supportedEthereumNetworks)[number];

export const isSupportedEthereumNetwork = (symbol: string): symbol is EthereumNetworkSymbol =>
    isArrayMember(symbol, supportedEthereumNetworks);
