import { isArrayMember } from '@trezor/utils';

export const supportedCardanoNetworks = ['ada'] as const;

export type CardanoNetworkSymbol = (typeof supportedCardanoNetworks)[number];

export const isSupportedCardanoNetwork = (symbol: string): symbol is CardanoNetworkSymbol =>
    isArrayMember(symbol, supportedCardanoNetworks);

export const toCardanoNetworkSymbol = (symbol: string): CardanoNetworkSymbol => {
    if (!isSupportedCardanoNetwork(symbol)) {
        throw new Error(`Unsupported Cardano network symbol: ${symbol}`);
    }

    return symbol;
};
