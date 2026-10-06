/* eslint-disable no-console */
import { MARKET_CAPS_IDS_PER_REQUEST, MARKET_CAP_FIAT_CURRENCY } from '../constants';
import { coinMarketsSchema } from '../schemas';
import { coinGeckoApi, getCoinGeckoHeaders } from './api';

const fetchCoinMarkets = coinGeckoApi('/coins/markets', {
    method: 'GET',
    schema: coinMarketsSchema,
});

const batchIds = (coinIds: string[]) => {
    const batches: string[][] = [];

    for (let index = 0; index < coinIds.length; index += MARKET_CAPS_IDS_PER_REQUEST) {
        batches.push(coinIds.slice(index, index + MARKET_CAPS_IDS_PER_REQUEST));
    }

    return batches;
};

/**
 * Fetch the market cap in USD of the given coins, keyed by CoinGecko coin id.
 *
 * `/coins/list`, which the definitions are built from, carries no market data, so the market caps
 * come from `/coins/markets` and are joined back on the coin id. The coins are asked for by id
 * rather than by paging the whole market list: a request that names what it wants cannot lose a
 * coin that moves between pages while the run is in progress.
 *
 * A coin CoinGecko has no market data for is absent from the result, which is an answer. A request
 * that fails is retried by the client and then throws, so a missing market cap can never be the
 * silent result of a failed fetch.
 */
export const fetchMarketCaps = async (coinIds: string[]): Promise<Map<string, number>> => {
    const marketCaps = new Map<string, number>();

    for (const ids of batchIds(coinIds)) {
        const markets = await fetchCoinMarkets({
            headers: getCoinGeckoHeaders(),
            params: {
                vs_currency: MARKET_CAP_FIAT_CURRENCY,
                ids: ids.join(','),
                per_page: ids.length,
            },
        });

        for (const { id, market_cap } of markets) {
            if (typeof market_cap === 'number') {
                marketCaps.set(id, market_cap);
            }
        }
    }

    console.log(
        `Market caps fetched for ${marketCaps.size} of ${coinIds.length} coin(s), in ${batchIds(coinIds).length} request(s)`,
    );

    return marketCaps;
};
