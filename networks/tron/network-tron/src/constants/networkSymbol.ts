import { isArrayMember } from '@trezor/utils';

export const supportedTronNetworks = ['trx', 'ttrx'] as const;

export type TronNetworkSymbol = (typeof supportedTronNetworks)[number];

export const isSupportedTronNetwork = (symbol: string): symbol is TronNetworkSymbol =>
    isArrayMember(symbol, supportedTronNetworks);

export const toTronNetworkSymbol = (symbol: string): TronNetworkSymbol => {
    if (!isSupportedTronNetwork(symbol)) {
        throw new Error(`Unsupported Tron network symbol: ${symbol}`);
    }

    return symbol;
};
