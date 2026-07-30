import type { NetworkSymbol } from '@trezor/network-module';
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

export const isSupportedEthereumNetwork = (
    symbol: NetworkSymbol,
): symbol is NetworkSymbol & EthereumNetworkSymbol =>
    isArrayMember(symbol as string, supportedEthereumNetworks);

export const toEthereumNetworkSymbol = (symbol: NetworkSymbol): EthereumNetworkSymbol => {
    if (!isSupportedEthereumNetwork(symbol)) {
        throw new Error(`Unsupported Ethereum network symbol: ${symbol}`);
    }

    return symbol;
};
