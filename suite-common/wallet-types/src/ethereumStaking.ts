export type StakeType = 'stake' | 'unstake' | 'claim' | 'change-delegate';

export const supportedNetworkSymbols = ['eth', 'thod'] as const;

export type SupportedEthereumNetworkSymbol = (typeof supportedNetworkSymbols)[number];
