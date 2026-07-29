import { isArrayMember } from '@trezor/utils';

export const supportedNetworks = ['sol', 'dsol'] as const;

export type SolanaNetworkSymbol = (typeof supportedNetworks)[number];

export const getSupportedNetworks = (): readonly SolanaNetworkSymbol[] => supportedNetworks;

export const isSupportedNetwork = (symbol: string): symbol is SolanaNetworkSymbol =>
    isArrayMember(symbol, supportedNetworks);
