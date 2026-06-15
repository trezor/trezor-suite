import { isArrayMember } from '@trezor/utils';

export const supportedNetworks = ['btc', 'test', 'regtest', 'ltc', 'doge', 'zec', 'bch'] as const;

export type BitcoinNetworkSymbol = (typeof supportedNetworks)[number];

export const getSupportedNetworks = (): readonly BitcoinNetworkSymbol[] => supportedNetworks;

export const isSupportedNetwork = (symbol: string): symbol is BitcoinNetworkSymbol =>
    isArrayMember(symbol, supportedNetworks);
