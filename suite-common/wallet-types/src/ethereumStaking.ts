export type StakeType = 'stake' | 'unstake' | 'claim' | 'change-delegate';

// The stake operations every staking sign flow supports
// StakeType additionally carries network-specific extensions (e.g. Cardano's 'change-delegate').
export type BaseStakeType = Extract<StakeType, 'stake' | 'unstake' | 'claim'>;

export const supportedNetworkSymbols = ['eth', 'thod'] as const;

export type SupportedEthereumNetworkSymbol = (typeof supportedNetworkSymbols)[number];
