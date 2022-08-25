export const actionPrefix = '@common/wallet-core/fiat-rates';

// how often should suite check for outdated rates;
export const INTERVAL = 1000 * 60 * 2; // 2 mins
export const INTERVAL_LAST_WEEK = 1000 * 60 * 60 * 1; // 1 hour
// which rates should be considered outdated and updated;
export const MAX_AGE = 1000 * 60 * 10; // 10 mins
export const MAX_AGE_LAST_WEEK = 1000 * 60 * 60 * 1; // 1 hour
