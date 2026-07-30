import type { NetworkSymbol } from '@trezor/network-module';
import { isArrayMember } from '@trezor/utils';

export const supportedTronNetworks = ['trx', 'ttrx'] as const;

export type TronNetworkSymbol = (typeof supportedTronNetworks)[number];

export const isSupportedTronNetwork = (
    symbol: NetworkSymbol,
): symbol is NetworkSymbol & TronNetworkSymbol =>
    isArrayMember(symbol as string, supportedTronNetworks);

export const toTronNetworkSymbol = (symbol: NetworkSymbol): TronNetworkSymbol => {
    if (!isSupportedTronNetwork(symbol)) {
        throw new Error(`Unsupported Tron network symbol: ${symbol}`);
    }

    return symbol;
};
