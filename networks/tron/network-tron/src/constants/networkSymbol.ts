import { isArrayMember } from '@trezor/utils';

export const supportedTronNetworks = ['trx', 'ttrx'] as const;

export type TronNetworkSymbol = (typeof supportedTronNetworks)[number];

export const isSupportedTronNetwork = (symbol: string): symbol is TronNetworkSymbol =>
    isArrayMember(symbol, supportedTronNetworks);
