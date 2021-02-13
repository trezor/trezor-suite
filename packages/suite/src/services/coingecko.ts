import { LastWeekRates, TickerId } from '@wallet-types/fiatRates';
import FIAT_CONFIG from '@suite-config/fiat';

const COINGECKO_API_BASE_URL = 'https://cdn.trezor.io/dynamic/coingecko/api/v3';

interface HistoricalResponse extends LastWeekRates {
    symbol: string;
}

class FiatRatesFetchError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'FiatRatesFetchError';
        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, FiatRatesFetchError);
        }
    }
}

const fetchCoinGecko = async (url: string) => {
    try {
        const res = await fetch(url);
        if (!res.ok) {
            throw new FiatRatesFetchError(`${res.status}: ${url}`);
        }
        return res.json();
    } catch (error) {
        throw new FiatRatesFetchError(`Failed to fetch: ${url}`);
    }
};

const getTickerConfig = (ticker: TickerId) => {
    // for token find its main network
    const config = FIAT_CONFIG.tickers.find(t =>
        ticker.tokenAddress ? t.symbol === ticker.mainNetworkSymbol : t.symbol === ticker.symbol,
    );

    if (!config) {
        console.error('buildCoinUrl: cannot find ticker config for ', ticker);
    }
    return config;
};

/**
 * Build coinUrl using defined coin ids
 *
 * @param {TickerId} ticker
 * @returns
 */
const buildCoinUrl = (ticker: TickerId) => {
    const config = getTickerConfig(ticker);
    if (!config) return null;

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
 * Returns the historical rate for a given symbol, timestamp fetched from CoinGecko API.
 * Be aware that the data granularity is 1 day.
 * Returns null if coin for a given symbol was not found.
 *
 * @param {TickerId} ticker
 * @param {number[]} timestamps
 * @returns
 */
export const getFiatRatesForTimestamps = async (
    ticker: TickerId,
    timestamps: number[],
): Promise<HistoricalResponse | null> => {
    const coinUrl = buildCoinUrl(ticker);
    const urlEndpoint = `history`;
    if (!coinUrl) return null;

    const url = `${coinUrl}/${urlEndpoint}`;

    const promises = timestamps.map(async t => {
        const d = new Date(t * 1000);
        const dateParam = `${d.getUTCDate()}-${d.getUTCMonth() + 1}-${d.getUTCFullYear()}`;

        const data = await fetchCoinGecko(`${url}?date=${dateParam}`);
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
 * @param {TickerId} ticker
 * @param {string} localCurrency
 * @returns {(Promise<HistoricalResponse | null>)}
 */
export const fetchLastWeekRates = async (
    ticker: TickerId,
    localCurrency: string,
): Promise<HistoricalResponse | null> => {
    const urlEndpoint = `market_chart`;
    const urlParams = `vs_currency=${localCurrency}&days=7`;
    const coinUrl = buildCoinUrl(ticker);
    if (!coinUrl) return null;

    const { symbol } = ticker;
    const url = `${coinUrl}/${urlEndpoint}?${urlParams}`;
    const data = await fetchCoinGecko(url);
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
