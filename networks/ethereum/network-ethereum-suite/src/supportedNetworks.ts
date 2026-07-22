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

export type EthereumSupportedNetwork = (typeof supportedNetworks)[number];

export const getSupportedNetwork = (): readonly EthereumSupportedNetwork[] => supportedNetworks;

export const isSupportedNetwork = (symbol: string): symbol is EthereumSupportedNetwork =>
    isArrayMember(symbol, supportedNetworks);
