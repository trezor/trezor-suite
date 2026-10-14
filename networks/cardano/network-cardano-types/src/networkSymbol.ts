import { isArrayMember } from '@trezor/utils';

export const supportedCardanoNetworks = ['ada'] as const;

export type CardanoNetworkSymbol = (typeof supportedCardanoNetworks)[number];

export const isSupportedCardanoNetwork = (symbol: string): symbol is CardanoNetworkSymbol =>
    isArrayMember(symbol, supportedCardanoNetworks);
