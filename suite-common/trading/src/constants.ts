export const TRADING_PREFIX = '@trading';
export const TRADING_BUY_PREFIX = `${TRADING_PREFIX}-buy`;
export const TRADING_EXCHANGE_PREFIX = `${TRADING_PREFIX}-exchange`;

export const TRADING_THUNK_PREFIX = `${TRADING_PREFIX}/thunk`;
export const TRADING_BUY_THUNK_PREFIX = `${TRADING_BUY_PREFIX}/thunk`;
export const TRADING_EXCHANGE_THUNK_PREFIX = `${TRADING_EXCHANGE_PREFIX}/thunk`;

export const TRADING_EXCHANGE_RATE_FIXED = 'fixed';
export const TRADING_EXCHANGE_RATE_FLOATING = 'floating';

export const INVITY_API_RELOAD_DATA_AFTER_MS = 10 * 60 * 1000; // 10 minutes
export const INVITY_API_RELOAD_QUOTES_AFTER_SECONDS = 30;

export const CRYPTO_PLATFORM_SEPARATOR = '--';
/**
 * Used for L2 networks (e.g. base, op)
 */
export const CONTRACT_ADDRESS_FOR_NATIVE_TOKEN = '0x0000000000000000000000000000000000000000';
