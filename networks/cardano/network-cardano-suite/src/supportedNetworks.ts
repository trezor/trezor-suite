import { isArrayMember } from '@trezor/utils';

export const supportedNetworks = ['ada'] as const;

export type CardanoSupportedNetwork = (typeof supportedNetworks)[number];

export const getSupportedNetwork = (): readonly CardanoSupportedNetwork[] => supportedNetworks;

export const isSupportedNetwork = (symbol: string): symbol is CardanoSupportedNetwork =>
    isArrayMember(symbol, supportedNetworks);
