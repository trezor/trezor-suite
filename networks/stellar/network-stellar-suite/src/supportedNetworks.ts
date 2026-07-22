import { isArrayMember } from '@trezor/utils';

export const supportedNetworks = ['xlm', 'txlm'] as const;

export type StellarSupportedNetwork = (typeof supportedNetworks)[number];

export const getSupportedNetwork = (): readonly StellarSupportedNetwork[] => supportedNetworks;

export const isSupportedNetwork = (symbol: string): symbol is StellarSupportedNetwork =>
    isArrayMember(symbol, supportedNetworks);
