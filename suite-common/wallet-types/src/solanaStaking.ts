export const supportedSolanaNetworkSymbols = ['sol', 'dsol'] as const;

export type SupportedSolanaNetworkSymbols = (typeof supportedSolanaNetworkSymbols)[number];
