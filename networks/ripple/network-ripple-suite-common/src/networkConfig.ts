import {
    DEFAULT_ACCOUNT_SYNC_INTERVAL,
    type SuiteCommonNetworkConfig,
    asProtocol,
} from '@trezor/network-module-suite-common-types';
import type { RippleNetworkSymbol } from '@trezor/network-ripple/constants';

const syncIntervalBySymbol: Readonly<Record<RippleNetworkSymbol, number>> = {
    xrp: DEFAULT_ACCOUNT_SYNC_INTERVAL,
    txrp: DEFAULT_ACCOUNT_SYNC_INTERVAL,
};

const networkConfigBySymbol: Readonly<Record<RippleNetworkSymbol, SuiteCommonNetworkConfig>> = {
    xrp: { color: '#24292e', protocols: [asProtocol('ripple'), asProtocol('xrp')] },
    txrp: { color: '#e75f5f', protocols: [asProtocol('txrp')] },
};

export const getNetworkConfig = (symbol: RippleNetworkSymbol): SuiteCommonNetworkConfig =>
    networkConfigBySymbol[symbol];

export const getAccountSyncInterval = (symbol: RippleNetworkSymbol): number =>
    syncIntervalBySymbol[symbol];
