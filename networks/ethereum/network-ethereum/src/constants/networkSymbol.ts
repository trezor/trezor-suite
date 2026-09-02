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
    'tsep',
    'thod',
] as const;

export type EthereumNetworkSymbol = (typeof supportedEthereumNetworks)[number];

export const isSupportedEthereumNetwork = (symbol: string): symbol is EthereumNetworkSymbol =>
    isArrayMember(symbol, supportedEthereumNetworks);

export const toEthereumNetworkSymbol = (symbol: string): EthereumNetworkSymbol => {
    if (!isSupportedEthereumNetwork(symbol)) {
        throw new Error(`Unsupported Ethereum network symbol: ${symbol}`);
    }

    return symbol;
};
