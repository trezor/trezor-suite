import { isArrayMember } from '@trezor/utils';

export const supportedTezosNetworks = ['xtz'] as const;

export type TezosNetworkSymbol = (typeof supportedTezosNetworks)[number];

export const isSupportedTezosNetwork = (symbol: string): symbol is TezosNetworkSymbol =>
    isArrayMember(symbol, supportedTezosNetworks);
