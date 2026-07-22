import { isArrayMember } from '@trezor/utils';

export const supportedNetworks = ['btc', 'test', 'regtest', 'ltc', 'doge', 'zec', 'bch'] as const;

export type BitcoinSupportedNetwork = (typeof supportedNetworks)[number];

export const getSupportedNetwork = (): readonly BitcoinSupportedNetwork[] => supportedNetworks;

export const isSupportedNetwork = (symbol: string): symbol is BitcoinSupportedNetwork =>
    isArrayMember(symbol, supportedNetworks);
