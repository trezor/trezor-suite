import { isArrayMember } from '@trezor/utils';

export const supportedNetworks = ['ada'] as const;

export type CardanoSuiteNetworkSymbol = (typeof supportedNetworks)[number];

export const getSupportedNetworks = (): readonly CardanoSuiteNetworkSymbol[] => supportedNetworks;

export const isSupportedNetwork = (symbol: string): symbol is CardanoSuiteNetworkSymbol =>
    isArrayMember(symbol, supportedNetworks);
