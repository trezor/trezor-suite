import { isArrayMember } from '@trezor/utils';

export const supportedNetworks = ['trx', 'ttrx'] as const;

export type TronNetworkSymbol = (typeof supportedNetworks)[number];

export const getSupportedNetworks = (): readonly TronNetworkSymbol[] => supportedNetworks;

export const isSupportedNetwork = (symbol: string): symbol is TronNetworkSymbol =>
    isArrayMember(symbol, supportedNetworks);
