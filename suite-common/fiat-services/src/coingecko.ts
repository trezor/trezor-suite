import { getNetwork, networks } from '@suite-common/wallet-config';
import { type HistoricRates, type TickerId } from '@suite-common/wallet-types';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { parseAsset } from '@trezor/blockchain-link-utils/src/blockfrost';

import { fetchUrl } from './fetch';
import { RateLimiter } from './limiter';

// a proxy for https://api.coingecko.com/api/v3
const COINGECKO_API_BASE_URL = 'https://cdn.trezor.io/dynamic/coingecko/api/v3';

const ONE_DAY_IN_S = 24 * 60 * 60;

interface HistoricalResponse extends HistoricRates {
    symbol: string;
}

interface FetchCurrentFiatRatesOptions {
    skipCache?: boolean;
}

const rateLimiter = new RateLimiter(1_000, 15_000);

const fetchCoinGecko = async (url: string, skipCache?: boolean) => {
    try {
        let res: Response;
        if (skipCache) {
            res = await fetchUrl(url, { headers: { 'X-Bypass-Cache': '1' } });
        } else {
            res = await rateLimiter.limit(signal => fetchUrl(url, { signal }));
        }
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
const buildCoinUrls = (ticker: TickerId) => {
    const { coingeckoId, tradeCryptoId, settlementLayer, networkType } = getNetwork(ticker.symbol);
    if (!coingeckoId) {
        console.error('buildCoinUrls: cannot find coingeckoId for ', ticker);

        return null;
    }

    let baseId = coingeckoId;
    if (networkType === 'ethereum') {
        if (ticker.tokenAddress) {
            // token on network -> network coingecko id
            baseId = coingeckoId;
        } else if (settlementLayer) {
            baseId = networks[settlementLayer]?.coingeckoId ?? coingeckoId;
        } else {
            // native token on network -> native token coingecko id
            if (!tradeCryptoId) {
                console.error('buildCoinUrls: cannot find tradeCryptoId for', ticker);

                return null;
            }
            baseId = tradeCryptoId;
        }
    }

    const baseUrl = `${COINGECKO_API_BASE_URL}/coins/${baseId}`;

    if (!ticker.tokenAddress) {
        return [baseUrl];
    }

    if (networkType === 'cardano') {
        const { policyId } = parseAsset(ticker.tokenAddress || '');

        return [`${baseUrl}/contract/${policyId}`, `${baseUrl}/contract/${ticker.tokenAddress}`];
    }

    if (networkType === 'stellar') {
        const parts = ticker.tokenAddress.split('-');
        const code = parts[0] ?? '';
        const issuer = parts[1] ?? '';

        // There are currently three formats on CoinGecko, we try them in order of frequency.
        return [
            `${baseUrl}/contract/${code}-${issuer}`,
            `${baseUrl}/contract/${code}-${issuer}-1`,
            `${baseUrl}/contract/${code}:${issuer}`,
        ];
    }

    return [`${baseUrl}/contract/${ticker.tokenAddress}`];
};

/**
 * Returns the current rate for a given symbol fetched from CoinGecko API.
 * Returns null if coin for a given symbol was not found.
 *
 * @param {TickerId} ticker
 * @returns
 */
export const fetchCurrentFiatRates = async (
    ticker: TickerId,
    options?: FetchCurrentFiatRatesOptions,
) => {
    const coinUrls = buildCoinUrls(ticker);
    if (!coinUrls || coinUrls.length === 0) return null;

    const urlParams =
        'tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false&localization=false';

    for (const coinUrl of coinUrls) {
        const url = `${coinUrl}?${urlParams}`;
        const rates = await fetchCoinGecko(url, options?.skipCache);

        if (rates) {
            return {
                ts: new Date().getTime() / 1000,
                rates: rates.market_data?.current_price,
            };
        }
    }

    return null;
};

/**
 * Helper function that goes through timestamped fiat rates returned from Coingecko and finds the closest one to the provided timestamp.
 * @returns [timestamp, fiatRate] pair
 */
export const findClosestTimestampValue = (
    timestamp: number,
    prices: Array<[number, number]>,
): number => {
    let closestTimestamp = prices[0] ?? [0, 0];

    for (let i = 1; i < prices.length; i++) {
        const currentTimeDelta = Math.abs(timestamp - closestTimestamp[0] / 1000);
        const next = prices[i];
        if (!next) break;
        const nextTimeDelta = Math.abs(timestamp - next[0] / 1000);

        // The timestamps are ordered, if next time delta is higher, we can stop the iteration.
        if (currentTimeDelta < nextTimeDelta) {
            break;
        }

        closestTimestamp = next;
    }

    return closestTimestamp[1];
};

/**
 * Returns the historical rates for a given symbol and array of timestamps, fetched from CoinGecko API.
 * Returns null if coin or fiat rates for a given symbol were not found.
 *
 * @param {TickerId} ticker
 * @param {number[]} timestamps
 * @param {BaseCurrencyCode} fiatCurrencyCode
 */
export const getFiatRatesForTimestamps = async (
    ticker: TickerId,
    timestamps: number[],
    fiatCurrencyCode: BaseCurrencyCode,
): Promise<HistoricalResponse | null> => {
    const coinUrls = buildCoinUrls(ticker); // Assuming this now returns an array of URLs
    const urlEndpoint = `market_chart/range`;
    if (!coinUrls || coinUrls.length === 0) return null;

    // sort timestamps chronologically to get the minimum and maximum values
    const sortedTimestampsInSeconds = [...timestamps].sort((ts1, ts2) => ts1 - ts2);

    // adjust from and to timestamps to get better range of data
    const fromTimestamp = (sortedTimestampsInSeconds[0] ?? 0) - ONE_DAY_IN_S;
    const toTimestamp =
        (sortedTimestampsInSeconds[sortedTimestampsInSeconds.length - 1] ?? 0) + ONE_DAY_IN_S;

    const params = `?vs_currency=${fiatCurrencyCode}&from=${fromTimestamp}&to=${toTimestamp}`;

    for (const coinUrl of coinUrls) {
        const url = `${coinUrl}/${urlEndpoint}${params}`;
        const response = await fetchCoinGecko(url);
        if (response?.prices && response.prices.length > 0) {
            const tickers = timestamps.map(ts => ({
                ts,
                rates: { [fiatCurrencyCode]: findClosestTimestampValue(ts, response.prices) },
            }));

            return {
                symbol: ticker.symbol,
                tickers,
                ts: new Date().getTime(),
            };
        }
    }

    return null;
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
    fiatCurrencyCode: BaseCurrencyCode,
): Promise<HistoricalResponse | null> => {
    const urlEndpoint = `market_chart`;
    const urlParams = `vs_currency=${fiatCurrencyCode}&days=7`;
    const coinUrls = buildCoinUrls(ticker);
    if (!coinUrls || coinUrls.length === 0) return null;

    const { symbol } = ticker;

    for (const coinUrl of coinUrls) {
        const url = `${coinUrl}/${urlEndpoint}?${urlParams}`;
        const data = await fetchCoinGecko(url);
        if (data) {
            const tickers = data.prices?.map((d: any) => ({
                ts: Math.floor(d[0] / 1000),
                rates: { [fiatCurrencyCode]: d[1] },
            }));
            if (tickers) {
                return {
                    symbol,
                    tickers,
                    ts: new Date().getTime(),
                };
            }
        }
    }

    return null;
};
