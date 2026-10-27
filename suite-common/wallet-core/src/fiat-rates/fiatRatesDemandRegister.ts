import { type RateTypeWithoutHistoric } from '@suite-common/wallet-types';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';

export type FiatRateDemand = {
    rateType: RateTypeWithoutHistoric;
    localCurrency: BaseCurrencyCode;
};

const getDemandKey = (rateType: RateTypeWithoutHistoric, localCurrency: BaseCurrencyCode) =>
    `${rateType}:${localCurrency}`;

const pendingDemands = new Map<string, FiatRateDemand>();

/**
 * Records that current/lastWeek rates should be fetched once discovery finishes.
 * Keys are unique by rate type + currency so repeated account actions collapse into one flush.
 */
export const markFiatRateDemandPending = (
    rateType: RateTypeWithoutHistoric,
    localCurrency: BaseCurrencyCode,
) => {
    pendingDemands.set(getDemandKey(rateType, localCurrency), { rateType, localCurrency });
};

export const hasPendingFiatRateDemand = () => pendingDemands.size > 0;

/** Returns and clears all pending demands. */
export const takePendingFiatRateDemand = (): FiatRateDemand[] => {
    const demands = Array.from(pendingDemands.values());
    pendingDemands.clear();

    return demands;
};

/** Clears pending demand without flushing. Intended for tests. */
export const clearPendingFiatRateDemand = () => {
    pendingDemands.clear();
};
