export type StakeType = 'stake' | 'unstake' | 'claim';

export const supportedNetworkSymbols = ['eth', 'thod'] as const;

export type SupportedEthereumNetworkSymbol = (typeof supportedNetworkSymbols)[number];
