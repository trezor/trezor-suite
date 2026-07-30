import type { NetworkSymbol } from '@trezor/network-module';
import { isArrayMember } from '@trezor/utils';

export const supportedStellarNetworks = ['xlm', 'txlm'] as const;

export type StellarNetworkSymbol = (typeof supportedStellarNetworks)[number];

export const isSupportedStellarNetwork = (
    symbol: NetworkSymbol,
): symbol is NetworkSymbol & StellarNetworkSymbol =>
    isArrayMember(symbol as string, supportedStellarNetworks);

export const toStellarNetworkSymbol = (symbol: NetworkSymbol): StellarNetworkSymbol => {
    if (!isSupportedStellarNetwork(symbol)) {
        throw new Error(`Unsupported Stellar network symbol: ${symbol}`);
    }

    return symbol;
};
