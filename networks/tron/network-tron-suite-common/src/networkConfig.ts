import {
    DEFAULT_ACCOUNT_SYNC_INTERVAL,
    type SuiteCommonNetworkConfig,
    asProtocol,
} from '@trezor/network-module-suite-common-types';
import type { TronNetworkSymbol } from '@trezor/network-tron/constants';

const syncIntervalBySymbol: Readonly<Record<TronNetworkSymbol, number>> = {
    trx: DEFAULT_ACCOUNT_SYNC_INTERVAL / 1.5,
    ttrx: DEFAULT_ACCOUNT_SYNC_INTERVAL,
};

const networkConfigBySymbol: Readonly<Record<TronNetworkSymbol, SuiteCommonNetworkConfig>> = {
    trx: { color: '#ec002a', protocols: [asProtocol('tron'), asProtocol('trx')] },
    ttrx: { color: '#ec002a', protocols: [asProtocol('ttrx')] },
};

export const getNetworkConfig = (symbol: TronNetworkSymbol): SuiteCommonNetworkConfig =>
    networkConfigBySymbol[symbol];

export const getAccountSyncInterval = (symbol: TronNetworkSymbol): number =>
    syncIntervalBySymbol[symbol];
