import * as coingecko from './coingecko';

export const {
    getTickerConfig,
    fetchCurrentTokenFiatRates,
    fetchCurrentFiatRates,
    fetchLastWeekRates,
    getFiatRatesForTimestamps,
} = coingecko;
