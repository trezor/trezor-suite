/* eslint-disable no-console */
import {
    COIN_MARKETS_URL,
    MARKET_CAPS_MAX_ATTEMPTS,
    MARKET_CAPS_MAX_PAGES,
    MARKET_CAPS_ORDER,
    MARKET_CAPS_PER_PAGE,
    MARKET_CAPS_RETRY_DELAY_MS,
    MARKET_CAP_FIAT_CURRENCY,
} from '../constants';
import { CoinMarketData } from '../types';

const options = {
    method: 'GET',
    headers: { 'x-cg-pro-api-key': process.env.COINGECKO_API_KEY! },
};

type MarketCapsPageResult =
    { data: CoinMarketData[] } | { retryableReason: string } | { fatalReason: string };

const isRetryableStatus = (status: number) => status === 429 || status >= 500;

const delay = (milliseconds: number) => new Promise(resolve => setTimeout(resolve, milliseconds));

const requestMarketCapsPage = async (url: string): Promise<MarketCapsPageResult> => {
    try {
        const response = await fetch(url, options);

        if (response.ok) {
            return { data: await response.json() };
        }

        const reason = `status: ${response.status}`;

        return isRetryableStatus(response.status)
            ? { retryableReason: reason }
            : { fatalReason: reason };
    } catch (error) {
        // A rejected fetch is a transport failure, which the next attempt may well survive.
        return { retryableReason: error instanceof Error ? error.message : String(error) };
    }
};

/**
 * A single page of market caps, retried with a growing delay while CoinGecko is rate limiting or
 * failing. The whole release job depends on this call, so a transient error must not abandon
 * definitions that are otherwise ready to publish.
 */
const fetchMarketCapsPage = async (page: number): Promise<CoinMarketData[]> => {
    const params = new URLSearchParams({
        vs_currency: MARKET_CAP_FIAT_CURRENCY,
        order: MARKET_CAPS_ORDER,
        per_page: String(MARKET_CAPS_PER_PAGE),
        page: String(page),
        sparkline: String(false),
    });
    const url = `${COIN_MARKETS_URL}?${params.toString()}`;

    for (let attempt = 1; attempt <= MARKET_CAPS_MAX_ATTEMPTS; attempt++) {
        const result = await requestMarketCapsPage(url);

        if ('data' in result) {
            return result.data;
        }

        if ('fatalReason' in result) {
            throw new Error(
                `CoinGecko coins/markets failed on page ${page}, ${result.fatalReason}`,
            );
        }

        if (attempt === MARKET_CAPS_MAX_ATTEMPTS) {
            throw new Error(
                `CoinGecko coins/markets failed on page ${page} after ${MARKET_CAPS_MAX_ATTEMPTS} attempts, ${result.retryableReason}`,
            );
        }

        console.warn(
            `CoinGecko coins/markets page ${page} failed (${result.retryableReason}), retrying.`,
        );
        await delay(MARKET_CAPS_RETRY_DELAY_MS * attempt);
    }

    throw new Error(`Retries for CoinGecko coins/markets page ${page} ended without a result`);
};

/**
 * Fetch the market cap in USD of every coin CoinGecko knows, keyed by coin id.
 *
 * The `coins/list` endpoint used to build the definitions carries no market data at all, so the
 * `coins/markets` list has to be paged through and joined onto the coin ids afterwards. Coins
 * without a market cap are left out, so a caller can tell them apart from a zero one.
 */
export const fetchMarketCaps = async (): Promise<Map<string, number>> => {
    const marketCaps = new Map<string, number>();

    for (let page = 1; page <= MARKET_CAPS_MAX_PAGES; page++) {
        const data = await fetchMarketCapsPage(page);

        for (const { id, market_cap } of data) {
            if (typeof market_cap === 'number') {
                marketCaps.set(id, market_cap);
            }
        }

        if (data.length < MARKET_CAPS_PER_PAGE) {
            console.log('Number of market cap records fetched:', marketCaps.size);

            return marketCaps;
        }
    }

    // Publishing a partial list would silently mark every coin that was never fetched as having
    // no market cap, so the whole run fails instead.
    throw new Error(
        `CoinGecko coins/markets did not end within ${MARKET_CAPS_MAX_PAGES} pages, refusing to build definitions from a partial market cap list`,
    );
};
