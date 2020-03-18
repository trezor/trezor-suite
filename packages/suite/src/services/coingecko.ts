import { LastWeekRates } from '@wallet-reducers/fiatRateReducer';

const COINGECKO_BASE_URL = 'https://api.coingecko.com/';

type FCFRParams = {
    symbol?: string;
    url?: string;
};

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
 * Returns the current rate for a given symbol fetched from CoinGecko API.
 * Returns null if coin for a given symbol was not found.
 *
 * @param {string} symbol
 * @returns
 */
export const fetchCurrentFiatRates = async (params: FCFRParams) => {
    let url: string | null = null;
    const { symbol } = params;

    if (params.url) {
        url = params.url;
    } else if (symbol) {
        // fetch coin id from coingecko and use it to build URL for fetching rates
        const coinList = await fetchCoinList();
        const coinData = coinList.find((t: any) => t.symbol === symbol.toLowerCase());
        if (!coinData) return null;
        url = `${COINGECKO_BASE_URL}api/v3/coins/${coinData.id}`;
    }

    if (!url) return null;

    const queryString =
        'tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false';
    url = `${url}?${queryString}`;

    const response = await fetch(url);
    const rates = await response.json();
    return {
        ts: new Date().getTime() / 1000,
        rates: rates.market_data.current_price,
        symbol: rates.symbol,
    };
};

/**
 * Returns the historical rate for a given symbol, timesttamp fetched from CoinGecko API.
 * Be aware that the data granularity is 1 day.
 * Returns null if coin for a given symbol was not found.
 *
 * @param {string} symbol
 * @returns
 */
export const getFiatRatesForTimestamps = async (
    symbol: string,
    timestamps: number[],
): Promise<HistoricalResponse | null> => {
    const coinList = await fetchCoinList();
    const coinData = coinList.find((t: any) => t.symbol === symbol.toLowerCase());
    if (!coinData) return null;

    const url = `${COINGECKO_BASE_URL}/api/v3/coins/${coinData.id}/history`;

    const promises = timestamps.map(async t => {
        const d = new Date(t * 1000);
        const dateParam = `${d.getUTCDate()}-${d.getUTCMonth() + 1}-${d.getUTCFullYear()}`;

        const response = await fetch(`${url}?date=${dateParam}`);
        const data = await response.json();
        // if (!data?.market_data?.current_price) return null;
        // TODO: market_data field is missing if they are no rates available for a given date
        return {
            ts: t,
            rates: data.market_data.current_price,
        };
    });

    const results = await Promise.all(promises);
    return {
        symbol,
        tickers: results,
        ts: new Date().getTime(),
    };
};
