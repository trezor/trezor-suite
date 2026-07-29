import { isArrayMember } from '@trezor/utils';

export const supportedNetworks = ['btc', 'test', 'regtest', 'ltc', 'doge', 'zec', 'bch'] as const;

export type BitcoinSuiteNetworkSymbol = (typeof supportedNetworks)[number];

export const getSupportedNetworks = (): readonly BitcoinSuiteNetworkSymbol[] => supportedNetworks;

export const isSupportedNetwork = (symbol: string): symbol is BitcoinSuiteNetworkSymbol =>
    isArrayMember(symbol, supportedNetworks);
