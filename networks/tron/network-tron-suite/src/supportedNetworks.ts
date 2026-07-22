import { isArrayMember } from '@trezor/utils';

export const supportedNetworks = ['trx', 'ttrx'] as const;

export type TronSupportedNetwork = (typeof supportedNetworks)[number];

export const getSupportedNetwork = (): readonly TronSupportedNetwork[] => supportedNetworks;

export const isSupportedNetwork = (symbol: string): symbol is TronSupportedNetwork =>
    isArrayMember(symbol, supportedNetworks);
