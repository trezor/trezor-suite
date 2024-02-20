import type { LastWeekRates, TimestampedRates, TickerId } from '@suite-common/wallet-types';

import { RateLimiter } from './limiter';
import { fetchUrl } from './fetch';

// TODO: generate from @trezor/connect-common/files/coins.json
const ENDPOINTS = {
    btc: ['btc1', 'btc2', 'btc3', 'btc4', 'btc5'],
};

type Ticker = keyof typeof ENDPOINTS;

const randomEndpoint = (ticker: Ticker) =>
    ENDPOINTS[ticker][Math.floor(Math.random() * ENDPOINTS[ticker].length)];

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

const getMultiTickers = async (
    ticker: Ticker,
    timestamps: number[],
    currency?: string,
): Promise<LastWeekRates | null> => {
    const url = `${getApiUrl(ticker)}/multi-tickers/?${getQuery({
        timestamp: timestamps.join(','),
        currency,
    })}`;

    const rates = !timestamps.length ? [] : await request<TimestampedRates[]>(url);

    return (
        rates && {
            ts: new Date().getTime(),
            symbol: ticker,
            tickers: rates.map((rate, i) => ({ ...rate, ts: timestamps[i] })),
        }
    );
};

const getLastWeekTimestamps = () =>
    Array.from(Array(7).keys()).map(i => {
        const date = new Date();
        date.setDate(date.getDate() - 7 + i);

        return Math.floor(date.getTime() / 1000);
    });

export const isTickerSupported = (ticker: TickerId): ticker is TickerId & { symbol: Ticker } =>
    !!ENDPOINTS[ticker.symbol as Ticker];

export const fetchCurrentFiatRates = getTickers;

export const getFiatRatesForTimestamps = getMultiTickers;

export const fetchLastWeekRates = (ticker: Ticker, currency: string) =>
    getMultiTickers(ticker, getLastWeekTimestamps(), currency);
