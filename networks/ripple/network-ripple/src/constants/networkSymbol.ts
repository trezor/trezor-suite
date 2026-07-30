import type { NetworkSymbol } from '@trezor/network-module';
import { isArrayMember } from '@trezor/utils';

export const supportedRippleNetworks = ['xrp', 'txrp'] as const;

export type RippleNetworkSymbol = (typeof supportedRippleNetworks)[number];

export const isSupportedRippleNetwork = (
    symbol: NetworkSymbol,
): symbol is NetworkSymbol & RippleNetworkSymbol =>
    isArrayMember(symbol as string, supportedRippleNetworks);

export const toRippleNetworkSymbol = (symbol: NetworkSymbol): RippleNetworkSymbol => {
    if (!isSupportedRippleNetwork(symbol)) {
        throw new Error(`Unsupported Ripple network symbol: ${symbol}`);
    }

    return symbol;
};
