import { LastWeekRates, TickerId } from '@suite-common/wallet-types';
import { FIAT as FIAT_CONFIG, FiatCurrencyCode } from '@suite-common/suite-config';

import { RateLimiter } from './limiter';
import { fetchUrl } from './fetch';

// a proxy for https://api.coingecko.com/api/v3
const COINGECKO_API_BASE_URL = 'https://cdn.trezor.io/dynamic/coingecko/api/v3';

interface HistoricalResponse extends LastWeekRates {
    symbol: string;
}

const rateLimiter = new RateLimiter(1000);

const fetchCoinGecko = async (url: string) => {
    try {
        const res = await rateLimiter.limit(() => fetchUrl(url));
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

export const getTickerConfig = (ticker: TickerId) =>
    // for token find its main network
    FIAT_CONFIG.tickers.find(t =>
        ticker.tokenAddress ? t.symbol === ticker.mainNetworkSymbol : t.symbol === ticker.symbol,
    );

/**
 * Build coinUrl using defined coin ids
 *
 * @param {TickerId} ticker
 * @returns
 */
const buildCoinUrl = (ticker: TickerId) => {
    const config = getTickerConfig(ticker);
    if (!config) {
        console.error('buildCoinUrl: cannot find ticker config for ', ticker);
        return null;
    }

    return `${COINGECKO_API_BASE_URL}/coins/${config.coingeckoId}`;
};

/**
 * Returns the current rate for a given token fetched from CoinGecko API.
 * Returns null if main network for the token is not ethereum.
 * Supports only tokens on ethereum.
 *
 * @param {TickerId} ticker
 * @returns
 */
export const fetchCurrentTokenFiatRates = async (ticker: TickerId) => {
    if (!ticker.tokenAddress) return null;

    const networkTickerConfig = getTickerConfig(ticker);
    if (!networkTickerConfig || networkTickerConfig?.coingeckoId !== 'ethereum') {
        console.warn('fetchCurrentTokenFiatRates: This API supports only ethereum', ticker);
        return null;
    }

    const url = `${COINGECKO_API_BASE_URL}/simple/token_price/${
        networkTickerConfig.coingeckoId
    }?contract_addresses=${ticker.tokenAddress}&vs_currencies=${FIAT_CONFIG.currencies.join(',')}`;

    const rates = await fetchCoinGecko(url);
    if (!rates) return null;

    return {
        ts: new Date().getTime() / 1000,
        rates: rates[ticker.tokenAddress.toLowerCase()],
    };
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
        'tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false';
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
const findClosestTimestampValue = (timestamp: number, arr: Array<[number, number]>): number => {
    let closestTimestamp = arr[0];
    for (let i = 1; i < arr.length; i++) {
        const currentTimeDelta = Math.abs(timestamp - closestTimestamp[0] / 1000);
        const nextTimeDelta = Math.abs(timestamp - arr[i][0] / 1000);

        closestTimestamp = arr[i];

        // The timestamps are ordered, if next time delta is higher, we can stop the iteration.
        if (currentTimeDelta < nextTimeDelta) {
            break;
        }
    }

    return closestTimestamp[1];
};

/**
 * Returns the historical rates for a given symbol adn array of timestamps, fetched from CoinGecko API.
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

    const params = `?vs_currency=${fiatCurrencyCode}&from=${timestamps[0]}&to=${
        timestamps[timestamps.length - 1]
    }`;
    const url = `${coinUrl}/${urlEndpoint}${params}`;

    // returns pairs of [timestamp, fiatRate]
    const response: { prices: Array<[number, number]> } = await fetchCoinGecko(url);
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
