import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';

export type StakeType = 'stake' | 'unstake' | 'claim' | 'change-delegate';

// The stake operations every staking sign flow supports
// StakeType additionally carries network-specific extensions (e.g. Cardano's 'change-delegate').
export type BaseStakeType = Extract<StakeType, 'stake' | 'unstake' | 'claim'>;

export const supportedNetworkSymbols = [
    asNetworkSymbol('eth'),
    asNetworkSymbol('thod'),
] as const satisfies NetworkSymbol[];

export type SupportedEthereumNetworkSymbol = (typeof supportedNetworkSymbols)[number];
