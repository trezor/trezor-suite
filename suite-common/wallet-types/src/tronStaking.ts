import { asNetworkSymbol } from '@suite-common/wallet-config';

export const supportedTronNetworkSymbols = [asNetworkSymbol('trx')] as const;

export type SupportedTronNetworkSymbols = (typeof supportedTronNetworkSymbols)[number];

export const TRON_RESOURCE_TYPES = ['bandwidth', 'energy'] as const;

export type TronResourceType = (typeof TRON_RESOURCE_TYPES)[number];
