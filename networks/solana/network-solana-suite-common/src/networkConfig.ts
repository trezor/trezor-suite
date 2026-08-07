import {
    DEFAULT_ACCOUNT_SYNC_INTERVAL,
    type SuiteCommonNetworkConfig,
    asProtocol,
} from '@trezor/network-module-suite-common-types';
import type { SolanaNetworkSymbol } from '@trezor/network-solana/constants';

const syncIntervalBySymbol: Readonly<Record<SolanaNetworkSymbol, number>> = {
    sol: DEFAULT_ACCOUNT_SYNC_INTERVAL * 5,
    dsol: DEFAULT_ACCOUNT_SYNC_INTERVAL,
};

const networkConfigBySymbol: Readonly<Record<SolanaNetworkSymbol, SuiteCommonNetworkConfig>> = {
    sol: { color: '#9945ff', protocols: [asProtocol('solana'), asProtocol('sol')] },
    dsol: { color: '#9945ff', protocols: [asProtocol('dsol')] },
};

export const getNetworkConfig = (symbol: SolanaNetworkSymbol): SuiteCommonNetworkConfig =>
    networkConfigBySymbol[symbol];

export const getAccountSyncInterval = (symbol: SolanaNetworkSymbol): number =>
    syncIntervalBySymbol[symbol];
