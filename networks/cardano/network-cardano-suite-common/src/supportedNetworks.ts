import { isArrayMember } from '@trezor/utils';

export const supportedNetworks = ['ada'] as const;

export type CardanoNetworkSymbol = (typeof supportedNetworks)[number];

export const getSupportedNetworks = (): readonly CardanoNetworkSymbol[] => supportedNetworks;

export const isSupportedNetwork = (symbol: string): symbol is CardanoNetworkSymbol =>
    isArrayMember(symbol, supportedNetworks);
