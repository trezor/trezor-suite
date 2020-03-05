const COINGECKO_BASE_URL = 'https://api.coingecko.com/';

type FCFRParams = {
    symbol?: string;
    url?: string;
};

interface HistoricalResponse {
    symbol: string;
    tickers: LastWeekRates['tickers'];
    ts: number;
}

/**
 * Returns an array with coins supported by CoinGecko API
 *
 * @returns {Promise<any>}
 */
export const fetchCoinList = async (): Promise<any> => {
    const url = new URL('/api/v3/coins/list', COINGECKO_BASE_URL);

    const response = await fetch(url.toString());
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
    let url: URL | null = null;
    const { symbol } = params;

    if (params.url) {
        url = new URL(params.url);
    } else if (symbol) {
        // fetch coin id from coingecko and use it to build URL for fetching rates
        const coinList = await fetchCoinList();
        const coinData = coinList.find((t: any) => t.symbol === symbol.toLowerCase());
        if (!coinData) return null;
        url = new URL(`/api/v3/coins/${coinData.id}`, COINGECKO_BASE_URL);
    }

    if (!url) return null;

    url.searchParams.set('tickers', 'false');
    url.searchParams.set('market_data', 'true');
    url.searchParams.set('community_data', 'false');
    url.searchParams.set('developer_data', 'false');
    url.searchParams.set('sparkline', 'false');

    const response = await fetch(url.toString());
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

    const url = new URL(`/api/v3/coins/${coinData.id}/history`, COINGECKO_BASE_URL);

    const promises = timestamps.map(async t => {
        const d = new Date(t * 1000);
        const dateParam = `${d.getUTCDate()}-${d.getUTCMonth() + 1}-${d.getUTCFullYear()}`;
        url.searchParams.set('date', dateParam);

        const response = await fetch(url.toString());
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
