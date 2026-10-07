import type { TimestampedRates } from '@suite-common/wallet-types';
import type { HistoricFiatRates } from '@trezor/network-module-suite-common-types';

/** Rates by time from tickers that each carry their own time; unknown (-1) rates are left out. */
export const toHistoricFiatRates = (
    tickers: readonly TimestampedRates[] | undefined,
    currency: string,
): HistoricFiatRates => {
    const rates: Record<number, number> = {};
    tickers?.forEach(ticker => {
        const rate = ticker.rates[currency as keyof typeof ticker.rates];

        if (rate !== undefined && rate >= 0) {
            rates[ticker.ts] = rate;
        }
    });

    return rates;
};
