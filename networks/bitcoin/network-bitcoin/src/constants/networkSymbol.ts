import { isArrayMember } from '@trezor/utils';

export const supportedBitcoinNetworks = [
    'btc',
    'test',
    'regtest',
    'ltc',
    'doge',
    'zec',
    'bch',
] as const;

export type BitcoinNetworkSymbol = (typeof supportedBitcoinNetworks)[number];

export const isSupportedBitcoinNetwork = (symbol: string): symbol is BitcoinNetworkSymbol =>
    isArrayMember(symbol, supportedBitcoinNetworks);

export const toBitcoinNetworkSymbol = (symbol: string): BitcoinNetworkSymbol => {
    if (!isSupportedBitcoinNetwork(symbol)) {
        throw new Error(`Unsupported Bitcoin network symbol: ${symbol}`);
    }

    return symbol;
};
