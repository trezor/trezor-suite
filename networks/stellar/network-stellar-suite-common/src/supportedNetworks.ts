import { isArrayMember } from '@trezor/utils';

export const supportedNetworks = ['xlm', 'txlm'] as const;

export type StellarNetworkSymbol = (typeof supportedNetworks)[number];

export const getSupportedNetworks = (): readonly StellarNetworkSymbol[] => supportedNetworks;

export const isSupportedNetwork = (symbol: string): symbol is StellarNetworkSymbol =>
    isArrayMember(symbol, supportedNetworks);
