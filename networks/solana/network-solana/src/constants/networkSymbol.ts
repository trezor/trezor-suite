import { isArrayMember } from '@trezor/utils';

export const supportedSolanaNetworks = ['sol', 'dsol'] as const;

export type SolanaNetworkSymbol = (typeof supportedSolanaNetworks)[number];

export const isSupportedSolanaNetwork = (symbol: string): symbol is SolanaNetworkSymbol =>
    isArrayMember(symbol, supportedSolanaNetworks);

export const toSolanaNetworkSymbol = (symbol: string): SolanaNetworkSymbol => {
    if (!isSupportedSolanaNetwork(symbol)) {
        throw new Error(`Unsupported Solana network symbol: ${symbol}`);
    }

    return symbol;
};
