import type { NetworkSymbol } from '@trezor/network-module';
import { isArrayMember } from '@trezor/utils';

export const supportedSolanaNetworks = ['sol', 'dsol'] as const;

export type SolanaNetworkSymbol = (typeof supportedSolanaNetworks)[number];

export const isSupportedSolanaNetwork = (
    symbol: NetworkSymbol,
): symbol is NetworkSymbol & SolanaNetworkSymbol =>
    isArrayMember(symbol as string, supportedSolanaNetworks);

export const toSolanaNetworkSymbol = (symbol: NetworkSymbol): SolanaNetworkSymbol => {
    if (!isSupportedSolanaNetwork(symbol)) {
        throw new Error(`Unsupported Solana network symbol: ${symbol}`);
    }

    return symbol;
};
