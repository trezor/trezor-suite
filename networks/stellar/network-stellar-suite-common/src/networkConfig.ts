import {
    DEFAULT_ACCOUNT_SYNC_INTERVAL,
    type SuiteCommonNetworkConfig,
    asProtocol,
} from '@trezor/network-module-suite-common-types';
import type { StellarNetworkSymbol } from '@trezor/network-stellar/constants';

const syncIntervalBySymbol: Readonly<Record<StellarNetworkSymbol, number>> = {
    xlm: DEFAULT_ACCOUNT_SYNC_INTERVAL,
    txlm: DEFAULT_ACCOUNT_SYNC_INTERVAL,
};

const networkConfigBySymbol: Readonly<Record<StellarNetworkSymbol, SuiteCommonNetworkConfig>> = {
    xlm: { color: '#000000', protocols: [asProtocol('stellar'), asProtocol('xlm')] },
    txlm: { color: '#e75f5f', protocols: [asProtocol('txlm')] },
};

export const getNetworkConfig = (symbol: StellarNetworkSymbol): SuiteCommonNetworkConfig =>
    networkConfigBySymbol[symbol];

export const getAccountSyncInterval = (symbol: StellarNetworkSymbol): number =>
    syncIntervalBySymbol[symbol];
