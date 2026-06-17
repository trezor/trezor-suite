export const supportedTronNetworkSymbols = ['trx'] as const;

export type SupportedTronNetworkSymbols = (typeof supportedTronNetworkSymbols)[number];
