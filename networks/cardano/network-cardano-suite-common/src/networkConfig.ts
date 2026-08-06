import type { CardanoNetworkSymbol } from '@trezor/network-cardano/constants';
import {
    DEFAULT_ACCOUNT_SYNC_INTERVAL,
    type SuiteCommonNetworkConfig,
    asProtocol,
} from '@trezor/network-module-suite-common-types';

const syncIntervalBySymbol: Readonly<Record<CardanoNetworkSymbol, number>> = {
    ada: DEFAULT_ACCOUNT_SYNC_INTERVAL,
};

const networkConfigBySymbol: Readonly<Record<CardanoNetworkSymbol, SuiteCommonNetworkConfig>> = {
    ada: { color: '#3468d1', protocols: [asProtocol('cardano'), asProtocol('ada')] },
};

export const getNetworkConfig = (symbol: CardanoNetworkSymbol): SuiteCommonNetworkConfig =>
    networkConfigBySymbol[symbol];

export const getAccountSyncInterval = (symbol: CardanoNetworkSymbol): number =>
    syncIntervalBySymbol[symbol];
