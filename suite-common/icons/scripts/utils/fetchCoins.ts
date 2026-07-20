import { sleep } from './sleep';
import {
    COIN_DATA_URL,
    COIN_LIST_URL,
    COIN_MARKETS_MAX_PAGES,
    COIN_MARKETS_PER_PAGE,
    COIN_MARKETS_URL,
    RATE_LIMIT_PER_MINUTE,
    UPDATED_ICONS_LIST_URL,
} from '../constants';
import { CoinData, CoinListData, CoinMarketData, UpdatedIconsList } from '../types';

const coingeckoApiOptions = {
    method: 'GET',
    headers: { 'x-cg-pro-api-key': process.env.COINGECKO_API_KEY! },
};

export const getUpdatedIconsList = async (): Promise<UpdatedIconsList> => {
    try {
        const response = await fetch(UPDATED_ICONS_LIST_URL);
        if (!response.ok) {
            throw new Error(`${response.status} ${response.statusText}`);
        }

        return response.json();
    } catch (error) {
        console.error('Failed to fetch updated icons list:', error);

        return {};
    }
};

export const getCoinList = async (): Promise<CoinListData[]> => {
    const url = new URL(COIN_LIST_URL);

    url.searchParams.set('include_platform', 'true');

    const response = await fetch(url, coingeckoApiOptions);
    if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
    }

    return await response.json();
};

export const getCoinData = async (id: string, retry: boolean = true): Promise<CoinData> => {
    const url = new URL(`${COIN_DATA_URL}${id}`);

    url.searchParams.set('localization', 'false');
    url.searchParams.set('tickers', 'false');
    url.searchParams.set('market_data', 'false');
    url.searchParams.set('community_data', 'false');
    url.searchParams.set('developer_data', 'false');
    url.searchParams.set('sparkline', 'false');

    const response = await fetch(url, coingeckoApiOptions);
    if (!response.ok) {
        if (retry && response.status === 429) {
            console.error('Too many requests, waiting for 60 seconds...');
            await sleep(60 * 1000);

            return getCoinData(id, false);
        }

        throw new Error(`${response.status} ${response.statusText}`);
    }

    return await response.json();
};

/**
 * Fetches image URLs in bulk from /coins/markets (up to 250 coins per request), which lets us
 * avoid one /coins/{id} request per coin. Only coins with market data are returned here; the
 * long tail without market data must fall back to getCoinData. Returns a map of coin id -> image URL.
 */
export const getCoinMarketImageUrls = async (): Promise<Map<string, string>> => {
    const imageUrlById = new Map<string, string>();
    const throttleMs = Math.ceil((60 / RATE_LIMIT_PER_MINUTE) * 1000);

    for (let page = 1; page <= COIN_MARKETS_MAX_PAGES; page++) {
        const url = new URL(COIN_MARKETS_URL);

        url.searchParams.set('vs_currency', 'usd');
        url.searchParams.set('per_page', COIN_MARKETS_PER_PAGE.toString());
        url.searchParams.set('page', page.toString());
        url.searchParams.set('sparkline', 'false');

        let coins: CoinMarketData[] | undefined;
        // Retry the same page a few times on rate-limit before giving up.
        for (let attempt = 0; attempt < 3; attempt++) {
            const response = await fetch(url, coingeckoApiOptions);

            if (response.ok) {
                coins = await response.json();
                break;
            }

            if (response.status === 429) {
                console.error(
                    `Too many requests (markets page ${page}), waiting for 60 seconds...`,
                );
                await sleep(60 * 1000);
                continue;
            }

            throw new Error(`${response.status} ${response.statusText}`);
        }

        if (!coins) {
            throw new Error(`Failed to fetch markets page ${page} after repeated rate-limiting`);
        }

        if (coins.length === 0) {
            break;
        }

        coins
            .filter(coin => coin.id && coin.image)
            .forEach(coin => {
                imageUrlById.set(coin.id, coin.image);
            });

        // A short page means we reached the end of the list.
        if (coins.length < COIN_MARKETS_PER_PAGE) {
            break;
        }

        await sleep(throttleMs);
    }

    return imageUrlById;
};
