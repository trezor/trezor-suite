import { isArrayMember } from '@trezor/utils';

export const supportedNetworks = ['sol', 'dsol'] as const;

export type SolanaSupportedNetwork = (typeof supportedNetworks)[number];

export const getSupportedNetwork = (): readonly SolanaSupportedNetwork[] => supportedNetworks;

export const isSupportedNetwork = (symbol: string): symbol is SolanaSupportedNetwork =>
    isArrayMember(symbol, supportedNetworks);
