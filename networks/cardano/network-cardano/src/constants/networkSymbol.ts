import type { NetworkSymbol } from '@trezor/network-module';
import { isArrayMember } from '@trezor/utils';

export const supportedCardanoNetworks = ['ada'] as const;

export type CardanoNetworkSymbol = (typeof supportedCardanoNetworks)[number];

export const isSupportedCardanoNetwork = (
    symbol: NetworkSymbol,
): symbol is NetworkSymbol & CardanoNetworkSymbol =>
    isArrayMember(symbol as string, supportedCardanoNetworks);

export const toCardanoNetworkSymbol = (symbol: NetworkSymbol): CardanoNetworkSymbol => {
    if (!isSupportedCardanoNetwork(symbol)) {
        throw new Error(`Unsupported Cardano network symbol: ${symbol}`);
    }

    return symbol;
};
