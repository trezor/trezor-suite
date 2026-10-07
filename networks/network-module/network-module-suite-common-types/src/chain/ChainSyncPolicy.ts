/** How long chain data stays fresh and how often it is refreshed while it is shown. */
export type ChainSyncPolicy = {
    readonly accountStaleTimeMs: number;
    readonly accountRefetchIntervalMs: number;
    readonly fiatRateStaleTimeMs: number;
    readonly fiatRateRefetchIntervalMs: number;
};

const FIAT_RATE_REFETCH_INTERVAL_MS = 3 * 60 * 1000;

/**
 * Policy for a network whose accounts are refreshed every `accountSyncIntervalMs`.
 * Fiat rates follow the interval the wallet has always used for current rates.
 */
export const getChainSyncPolicy = (accountSyncIntervalMs: number): ChainSyncPolicy => ({
    accountStaleTimeMs: accountSyncIntervalMs,
    accountRefetchIntervalMs: accountSyncIntervalMs,
    fiatRateStaleTimeMs: FIAT_RATE_REFETCH_INTERVAL_MS,
    fiatRateRefetchIntervalMs: FIAT_RATE_REFETCH_INTERVAL_MS,
});
