import type { NetworkSymbol } from '@trezor/network-module';
import { isArrayMember } from '@trezor/utils';

export const supportedBitcoinNetworks = [
    'btc',
    'test',
    'regtest',
    'ltc',
    'doge',
    'zec',
    'bch',
] as const;

export type BitcoinNetworkSymbol = (typeof supportedBitcoinNetworks)[number];

export const isSupportedBitcoinNetwork = (
    symbol: NetworkSymbol,
): symbol is NetworkSymbol & BitcoinNetworkSymbol =>
    isArrayMember(symbol as string, supportedBitcoinNetworks);

export const toBitcoinNetworkSymbol = (symbol: NetworkSymbol): BitcoinNetworkSymbol => {
    if (!isSupportedBitcoinNetwork(symbol)) {
        throw new Error(`Unsupported Bitcoin network symbol: ${symbol}`);
    }

    return symbol;
};
