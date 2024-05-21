import { networks } from '@suite-common/wallet-config';
import { LastWeekRates, TickerId } from '@suite-common/wallet-types';
import { FiatCurrencyCode } from '@suite-common/suite-config';

import { RateLimiter } from './limiter';
import { fetchUrl } from './fetch';

// a proxy for https://api.coingecko.com/api/v3
const COINGECKO_API_BASE_URL = 'https://cdn.trezor.io/dynamic/coingecko/api/v3';

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

interface HistoricalResponse extends LastWeekRates {
    symbol: string;
}

const rateLimiter = new RateLimiter(1_000, 15_000);

const fetchCoinGecko = async (url: string) => {
    try {
        const res = await rateLimiter.limit(signal => fetchUrl(url, { signal }));
        if (!res.ok) {
            console.warn(`Coingecko: Fiat rates failed to fetch: ${res.status}`);

            return;
        }

        return res.json();
    } catch (error) {
        // Do not report to Sentry to save the issues count limit.
        console.warn(error);
    }
};

/**
 * Build coinUrl using defined coin ids
 *
 * @param {TickerId} ticker
 * @returns
 */
const buildCoinUrl = (ticker: TickerId) => {
    const { coingeckoId } = networks[ticker.symbol];
    if (!coingeckoId) {
        console.error('buildCoinUrl: cannot find coingecko asset platform id for ', ticker);

        return null;
    }

    const baseUrl = `${COINGECKO_API_BASE_URL}/coins/${coingeckoId}`;

    return ticker.tokenAddress ? `${baseUrl}/contract/${ticker.tokenAddress}` : baseUrl;
};

/**
 * Returns the current rate for a given symbol fetched from CoinGecko API.
 * Returns null if coin for a given symbol was not found.
 *
 * @param {TickerId} ticker
 * @returns
 */
export const fetchCurrentFiatRates = async (ticker: TickerId) => {
    const coinUrl = buildCoinUrl(ticker);
    if (!coinUrl) return null;
    const urlParams =
        'tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false&localization=false';
    const url = `${coinUrl}?${urlParams}`;

    const rates = await fetchCoinGecko(url);
    if (!rates) return null;

    return {
        ts: new Date().getTime() / 1000,
        rates: rates.market_data?.current_price,
    };
};

/**
 * Helper function that goes through timestamped fiat rates returned from Coingecko and finds the closest one to the provided timestamp.
 * @returns [timestamp, fiatRate] pair
 */
export const findClosestTimestampValue = (
    timestamp: number,
    prices: Array<[number, number]>,
): number => {
    let closestTimestamp = prices[0];

    for (let i = 1; i < prices.length; i++) {
        const currentTimeDelta = Math.abs(timestamp - closestTimestamp[0] / 1000);
        const nextTimeDelta = Math.abs(timestamp - prices[i][0] / 1000);

        // The timestamps are ordered, if next time delta is higher, we can stop the iteration.
        if (currentTimeDelta < nextTimeDelta) {
            break;
        }

        closestTimestamp = prices[i];
    }

    return closestTimestamp[1];
};

/**
 * Returns the historical rates for a given symbol and array of timestamps, fetched from CoinGecko API.
 * Returns null if coin or fiat rates for a given symbol were not found.
 *
 * @param {TickerId} ticker
 * @param {number[]} timestamps
 */
export const getFiatRatesForTimestamps = async (
    ticker: TickerId,
    timestamps: number[],
    fiatCurrencyCode: FiatCurrencyCode,
): Promise<HistoricalResponse | null> => {
    const coinUrl = buildCoinUrl(ticker);
    const urlEndpoint = `market_chart/range`;
    if (!coinUrl) return null;

    // sort timestamps chronologically to get the minimum and maximum values
    const sortedTimestamps = [...timestamps].sort((ts1, ts2) => ts1 - ts2);

    // adjust from and to timestamps to get better range of data
    const fromTimestamp = sortedTimestamps[0] - ONE_DAY_IN_MS;
    const toTimestamp = sortedTimestamps[sortedTimestamps.length - 1] + ONE_DAY_IN_MS;

    const params = `?vs_currency=${fiatCurrencyCode}&from=${fromTimestamp}&to=${toTimestamp}`;
    const url = `${coinUrl}/${urlEndpoint}${params}`;

    // returns pairs of [timestamp, fiatRate]
    const response = await fetchCoinGecko(url);
    if (!response?.prices || response?.prices.length === 0) {
        return null;
    }

    const tickers = timestamps.map(ts => ({
        ts,
        rates: { [fiatCurrencyCode]: findClosestTimestampValue(ts, response.prices) },
    }));

    return {
        symbol: ticker.symbol,
        tickers,
        ts: new Date().getTime(),
    };
};

/**
 * Returns the historical rates for the past 7 days
 * Be aware that the data granularity is 1 day.
 * Returns null if coin for a given symbol was not found.
 *
 * @param {TickerId} ticker
 * @param {string} fiatCurrencyCode
 * @returns {(Promise<HistoricalResponse | null>)}
 */
export const fetchLastWeekRates = async (
    ticker: TickerId,
    fiatCurrencyCode: FiatCurrencyCode,
): Promise<HistoricalResponse | null> => {
    const urlEndpoint = `market_chart`;
    const urlParams = `vs_currency=${fiatCurrencyCode}&days=7`;
    const coinUrl = buildCoinUrl(ticker);
    if (!coinUrl) return null;

    const { symbol } = ticker;
    const url = `${coinUrl}/${urlEndpoint}?${urlParams}`;
    const data = await fetchCoinGecko(url);
    const tickers = data?.prices?.map((d: any) => ({
        ts: Math.floor(d[0] / 1000),
        rates: { [fiatCurrencyCode]: d[1] },
    }));
    if (!tickers) return null;

    return {
        symbol,
        tickers,
        ts: new Date().getTime(),
    };
};
