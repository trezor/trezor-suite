import { isArrayMember } from '@trezor/utils';

export const supportedRippleNetworks = ['xrp', 'txrp'] as const;

export type RippleNetworkSymbol = (typeof supportedRippleNetworks)[number];

export const isSupportedRippleNetwork = (symbol: string): symbol is RippleNetworkSymbol =>
    isArrayMember(symbol, supportedRippleNetworks);
