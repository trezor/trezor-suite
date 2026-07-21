/* eslint-disable no-console */
import { z } from 'zod';

import { createHttpClient, isResponseError } from '@suite-common/http-client';

import { sleep } from './sleep';
import {
    COINGECKO_API_BASE_URL,
    COINGECKO_API_KEY_HEADER,
    COINGECKO_API_KEY_VALUE,
    COIN_MARKETS_PER_PAGE,
    RATE_LIMIT_PER_MINUTE,
    UPDATED_ICONS_LIST_URL,
} from '../constants';
import {
    CoinData,
    coinDataSchema,
    coinListDataSchema,
    coinMarketsSchema,
    updatedIconsListSchema,
} from '../schemas';

const coinGeckoApi = createHttpClient({
    baseUrl: COINGECKO_API_BASE_URL,
    headers: { [COINGECKO_API_KEY_HEADER]: COINGECKO_API_KEY_VALUE },
    onError: error => {
        console.error('Error fetching from CoinGecko API:', error);
    },
});

// The updated-icons checkpoint lives on the trezor CDN, not CoinGecko, so it must NOT carry the
// CoinGecko API key — hence a separate headerless client.
const trezorDataApi = createHttpClient({
    onError: error => {
        console.error('Error fetching updated icons list:', error);
    },
});

const fetchCoinMarketsPage = coinGeckoApi('/coins/markets', {
    method: 'GET',
    schema: coinMarketsSchema,
    // Retry rate-limited pages after waiting for the per-minute window to reset.
    retry: {
        attempts: 3,
        delay: 60 * 1000,
        when: ({ response }) => response?.status === 429,
    },
});

export const fetchCoinList = coinGeckoApi('/coins/list', {
    method: 'GET',
    schema: z.array(coinListDataSchema),
    params: {
        include_platform: true,
    },
});

const fetchCoinData = coinGeckoApi(`/coins/:id`, {
    method: 'GET',
    schema: coinDataSchema,
});

export const fetchUpdatedIconsList = trezorDataApi(UPDATED_ICONS_LIST_URL, {
    method: 'GET',
    schema: updatedIconsListSchema,
});

export const getCoinData = async (id: string, retry: boolean = true): Promise<CoinData> => {
    try {
        return await fetchCoinData({
            routeParams: { id },
            params: {
                localization: false,
                tickers: false,
                market_data: false,
                community_data: false,
                developer_data: false,
                sparkline: false,
            },
        });
    } catch (error) {
        if (retry && isResponseError(error) && error.status === 429) {
            console.error('Too many requests, waiting for 60 seconds...', error.data);
            await sleep(60 * 1000);

            return getCoinData(id, false);
        }

        if (isResponseError(error)) {
            console.error(`Failed to fetch coin data (${id}):`, error.status, error.data);
        }

        throw error;
    }
};

/**
 * Fetches image URLs in bulk from /coins/markets (up to 250 coins per request), which lets us
 * avoid one /coins/{id} request per coin. Only coins with market data are returned here; the
 * long tail without market data must fall back to getCoinData. Returns a map of coin id -> image URL.
 */
export const getCoinMarketImageUrls = async (): Promise<Map<string, string>> => {
    const imageUrlById = new Map<string, string>();
    const throttleMs = Math.ceil((60 / RATE_LIMIT_PER_MINUTE) * 1000);

    // Fetch pages sequentially, spacing requests to stay under RATE_LIMIT_PER_MINUTE. Rate-limit
    // retries are handled declaratively by the fetcher's retry options.
    let page = 1;
    let reachedEnd = false;

    while (!reachedEnd) {
        const coins = await fetchCoinMarketsPage({
            params: {
                vs_currency: 'usd',
                per_page: COIN_MARKETS_PER_PAGE,
                page,
                sparkline: false,
            },
        });

        console.log(`Fetched markets page ${page} (${coins.length} coins)`);

        coins
            .filter(coin => coin.id && coin.image)
            .forEach(coin => {
                imageUrlById.set(coin.id, coin.image);
            });

        // A short or empty page means we reached the end of the list.
        reachedEnd = coins.length < COIN_MARKETS_PER_PAGE;

        if (!reachedEnd) {
            await sleep(throttleMs);
            page += 1;
        }
    }

    return imageUrlById;
};
