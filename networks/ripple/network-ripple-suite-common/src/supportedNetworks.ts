import { isArrayMember } from '@trezor/utils';

export const supportedNetworks = ['xrp', 'txrp'] as const;

export type RippleNetworkSymbol = (typeof supportedNetworks)[number];

export const getSupportedNetworks = (): readonly RippleNetworkSymbol[] => supportedNetworks;

export const isSupportedNetwork = (symbol: string): symbol is RippleNetworkSymbol =>
    isArrayMember(symbol, supportedNetworks);
