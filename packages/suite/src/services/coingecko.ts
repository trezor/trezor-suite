import { LastWeekRates } from '@wallet-reducers/fiatRatesReducer';
import { FiatTicker } from '@wallet-types';

const COINGECKO_BASE_URL = 'https://api.coingecko.com/';

interface HistoricalResponse extends LastWeekRates {
    symbol: string;
}

/**
 * Returns an array with coins supported by CoinGecko API
 *
 * @returns {Promise<any>}
 */
export const fetchCoinList = async (): Promise<any> => {
    const url = `${COINGECKO_BASE_URL}api/v3/coins/list`;

    const response = await fetch(url);
    const tokens = await response.json();
    return tokens;
};

/**
 * Build coinUrl from the `ticker.url` if available.
 * Otherwise fetch coin ID from CoinGecko and use that.
 *
 * @param {FiatTicker} ticker
 * @returns
 */
const buildCoinUrl = async (ticker: FiatTicker) => {
    let coinUrl: string | null = null;
    const { symbol } = ticker;
    if (ticker.url) {
        coinUrl = ticker.url;
    } else if (symbol) {
        // fetch coin id from coingecko and use it to build URL for fetching rates
        const coinList = await fetchCoinList();
        const coinData = coinList.find((t: any) => t.symbol === symbol.toLowerCase());
        if (!coinData) return null;
        coinUrl = `${COINGECKO_BASE_URL}/api/v3/coins/${coinData.id}`;
    }
    return coinUrl;
};

/**
 * Returns the current rate for a given symbol fetched from CoinGecko API.
 * Returns null if coin for a given symbol was not found.
 *
 * @param {string} symbol
 * @returns
 */
export const fetchCurrentFiatRates = async (ticker: FiatTicker) => {
    const coinUrl = await buildCoinUrl(ticker);
    if (!coinUrl) return null;
    const urlParams =
        'tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false';
    const url = `${coinUrl}?${urlParams}`;

    const response = await fetch(url);
    const rates = await response.json();
    if (!rates) return null;

    return {
        ts: new Date().getTime() / 1000,
        rates: rates.market_data?.current_price,
        symbol: rates.symbol,
    };
};

/**
 * Returns the historical rate for a given symbol, timestamp fetched from CoinGecko API.
 * Be aware that the data granularity is 1 day.
 * Returns null if coin for a given symbol was not found.
 *
 * @param {string} symbol
 * @returns
 */
export const getFiatRatesForTimestamps = async (
    ticker: FiatTicker,
    timestamps: number[],
): Promise<HistoricalResponse | null> => {
    const coinUrl = await buildCoinUrl(ticker);
    const urlEndpoint = `history`;
    if (!coinUrl) return null;

    const url = `${coinUrl}/${urlEndpoint}`;

    const promises = timestamps.map(async t => {
        const d = new Date(t * 1000);
        const dateParam = `${d.getUTCDate()}-${d.getUTCMonth() + 1}-${d.getUTCFullYear()}`;

        const response = await fetch(`${url}?date=${dateParam}`);
        const data = await response.json();
        return {
            ts: t,
            rates: data?.market_data?.current_price,
        };
    });

    const results = await Promise.all(promises);
    return {
        symbol: ticker.symbol,
        tickers: results,
        ts: new Date().getTime(),
    };
};

/**
 * Returns the historical rates for the past 7 days
 * Be aware that the data granularity is 1 day.
 * Returns null if coin for a given symbol was not found.
 *
 * @param {FiatTicker} ticker
 * @param {string} localCurrency
 * @returns {(Promise<HistoricalResponse | null>)}
 */
export const fetchLastWeekRates = async (
    ticker: FiatTicker,
    localCurrency: string,
): Promise<HistoricalResponse | null> => {
    const urlEndpoint = `market_chart`;
    const urlParams = `vs_currency=${localCurrency}&days=7`;
    const coinUrl = await buildCoinUrl(ticker);
    if (!coinUrl) return null;

    const { symbol } = ticker;
    const url = `${coinUrl}/${urlEndpoint}?${urlParams}`;
    const response = await fetch(url);
    const data = await response.json();
    const tickers = data?.prices?.map((d: any) => ({
        ts: Math.floor(d[0] / 1000),
        rates: { [localCurrency]: d[1] },
    }));
    if (!tickers) return null;

    return {
        symbol,
        tickers,
        ts: new Date().getTime(),
    };
};
