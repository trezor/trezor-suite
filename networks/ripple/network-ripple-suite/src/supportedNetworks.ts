import { isArrayMember } from '@trezor/utils';

export const supportedNetworks = ['xrp', 'txrp'] as const;

export type RippleSupportedNetwork = (typeof supportedNetworks)[number];

export const getSupportedNetwork = (): readonly RippleSupportedNetwork[] => supportedNetworks;

export const isSupportedNetwork = (symbol: string): symbol is RippleSupportedNetwork =>
    isArrayMember(symbol, supportedNetworks);
