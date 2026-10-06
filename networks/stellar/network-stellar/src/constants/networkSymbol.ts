import { isArrayMember } from '@trezor/utils';

export const supportedStellarNetworks = ['xlm', 'txlm'] as const;

export type StellarNetworkSymbol = (typeof supportedStellarNetworks)[number];

export const isSupportedStellarNetwork = (symbol: string): symbol is StellarNetworkSymbol =>
    isArrayMember(symbol, supportedStellarNetworks);
