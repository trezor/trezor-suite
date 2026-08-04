import type { HistoricRates, TimestampedRates } from '@suite-common/wallet-types';
import { getWeakRandomInt } from '@trezor/utils';

import { fetchUrl } from './fetch';
import { RateLimiter } from './limiter';

// TODO: generate from @trezor/connect-data/files/coins.json
const ENDPOINTS = {
    btc: ['btc1', 'btc2', 'btc3', 'btc4', 'btc5'],
};

type Ticker = keyof typeof ENDPOINTS;

const randomEndpoint = (ticker: Ticker) =>
    ENDPOINTS[ticker][getWeakRandomInt(0, ENDPOINTS[ticker].length)];

const getQuery = (query?: { currency?: string; timestamp?: number | string }) =>
    Object.entries(query || {})
        .filter(([, val]) => val !== undefined)
        .map(([key, val]) => `${key}=${val}`)
        .join('&');

const getApiUrl = (ticker: Ticker) => `https://${randomEndpoint(ticker)}.trezor.io/api/v2`;

const limiter = new RateLimiter(500, 15_000);

const request = <T>(url: string): Promise<T | null> =>
    limiter
        .limit(signal => fetchUrl(url, { signal }))
        .then(res =>
            res.ok
                ? res.json()
                : Promise.reject(new Error(`Blockbook: Fiat rates failed to fetch: ${res.status}`)),
        )
        .catch(err => {
            console.warn(err);

            return null;
        });

const getTickers = (ticker: Ticker, timestamp?: number, currency?: string) => {
    const url = `${getApiUrl(ticker)}/tickers/?${getQuery({
        timestamp,
        currency,
    })}`;

    return request<TimestampedRates>(url);
};

/**
 * Blockbook fiat-rate responses are fetched from `*.trezor.io/api/v2` over TLS but are NOT
 * signed, so a compromised/MITM backend could return a truthy non-array body. Guarding the
 * `.map` here at the data boundary prevents `rates.map is not a function` from rejecting the
 * parallelRequestsCache promise and aborting the whole fiat-rate/graph fetch (sibling of the
 * Coingecko `sanitizePrices` guard). `null` (fetch failure) is passed through as before.
 */
export const buildHistoricRates = (
    ticker: Ticker,
    rates: unknown,
    timestamps: number[],
): HistoricRates | null => {
    if (!Array.isArray(rates)) return null;

    return {
        ts: new Date().getTime(),
        symbol: ticker,
        tickers: rates.map((rate, i) => {
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const ts: (typeof timestamps)[number] = timestamps[i];

            return { ...rate, ts };
        }),
    };
};

const getMultiTickers = async (
    ticker: Ticker,
    timestamps: number[],
    currency?: string,
): Promise<HistoricRates | null> => {
    const url = `${getApiUrl(ticker)}/multi-tickers/?${getQuery({
        timestamp: timestamps.join(','),
        currency,
    })}`;

    const rates = !timestamps.length ? [] : await request<TimestampedRates[]>(url);

    return buildHistoricRates(ticker, rates, timestamps);
};

const getLastWeekTimestamps = () =>
    Array.from(Array(7).keys()).map(i => {
        const date = new Date();
        date.setDate(date.getDate() - 7 + i);

        return Math.floor(date.getTime() / 1000);
    });

export const fetchCurrentFiatRates = getTickers;

export const getFiatRatesForTimestamps = getMultiTickers;

export const fetchLastWeekRates = (ticker: Ticker, currency: string) =>
    getMultiTickers(ticker, getLastWeekTimestamps(), currency);
