import { asNetworkSymbol } from '@suite-common/wallet-config';

export type StakeType = 'stake' | 'unstake' | 'claim' | 'change-delegate';

export const supportedNetworkSymbols = [asNetworkSymbol('eth'), asNetworkSymbol('thod')] as const;

export type SupportedEthereumNetworkSymbol = (typeof supportedNetworkSymbols)[number];
