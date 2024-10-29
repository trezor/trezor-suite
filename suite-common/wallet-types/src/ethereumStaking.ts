export type StakeType = 'stake' | 'unstake' | 'claim';

export const supportedNetworkSymbols = ['eth', 'thol'] as const;

export type SupportedNetworkSymbol = (typeof supportedNetworkSymbols)[number];
