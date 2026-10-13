import { isArrayMember } from '@trezor/utils';

export const supportedMoneroNetworks = ['xmr'] as const;

export type MoneroNetworkSymbol = (typeof supportedMoneroNetworks)[number];

export const isSupportedMoneroNetwork = (symbol: string): symbol is MoneroNetworkSymbol =>
    isArrayMember(symbol, supportedMoneroNetworks);
