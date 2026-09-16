import { isArrayMember } from '@trezor/utils';

export const supportedSolanaNetworks = ['sol', 'dsol'] as const;

export type SolanaNetworkSymbol = (typeof supportedSolanaNetworks)[number];

export const isSupportedSolanaNetwork = (symbol: string): symbol is SolanaNetworkSymbol =>
    isArrayMember(symbol, supportedSolanaNetworks);
