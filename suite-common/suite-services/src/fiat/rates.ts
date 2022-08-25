import type { TickerId, TimestampedRates, LastWeekRates } from '@suite-common/wallet-types';

import { coingeckoService as cg } from './coingecko';
import { blockbookService as bb } from './blockbook';

export const { getTickerConfig, fetchCurrentTokenFiatRates } = cg;

export const fetchCurrentFiatRates = async (ticker: TickerId): Promise<TimestampedRates | null> => {
    const res = bb.isTickerSupported(ticker) ? await bb.fetchCurrentFiatRates(ticker.symbol) : null;
    return res ?? cg.fetchCurrentFiatRates(ticker);
};

export const fetchLastWeekRates = async (
    ticker: TickerId,
    currency: string,
): Promise<LastWeekRates | null> => {
    const res = bb.isTickerSupported(ticker)
        ? await bb.fetchLastWeekRates(ticker.symbol, currency)
        : null;
    return res ?? cg.fetchLastWeekRates(ticker, currency);
};

export const getFiatRatesForTimestamps = async (
    ticker: TickerId,
    timestamps: number[],
): Promise<LastWeekRates | null> => {
    const res = bb.isTickerSupported(ticker)
        ? await bb.getFiatRatesForTimestamps(ticker.symbol, timestamps)
        : null;
    return res ?? cg.getFiatRatesForTimestamps(ticker, timestamps);
};
