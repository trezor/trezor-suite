/*
 * Bump version in case the new version of message system is not backward compatible.
 */
export const VERSION = 1;

export const JWS_SIGN_ALGORITHM = 'ES256';

export const JWS_CONFIG_FILENAME_REMOTE = `config.v${VERSION}.jws`;
export const JWS_CONFIG_FILENAME_LOCAL = `config.v${VERSION}.ts`;

/*
 * On the app launch and then about once in FETCH_INTERVAL_IN_MS, a new config tries to fetch.
 * FETCH_CHECK_INTERVAL_IN_MS is interval for checking if FETCH_INTERVAL_IN_MS already expired.
 * "_MOBILE" variant is used for mobile apps.
 */
export const FETCH_INTERVAL_IN_MS = 60_000; // 1 minute in milliseconds
export const FETCH_INTERVAL_IN_MS_MOBILE = 600_000; // 10 min

export const FETCH_CHECK_INTERVAL_IN_MS = 30_000; // 30 sec
export const FETCH_CHECK_INTERVAL_IN_MS_MOBILE = 180_000; // 3 min

// timeout for fetching remote config
export const FETCH_TIMEOUT_IN_MS = 30_000; // 30 sec

export const CONFIG_URL_REMOTE_BASE = 'https://data.trezor.io/config';
export const CONFIG_URL_REMOTE = {
    stable: `${CONFIG_URL_REMOTE_BASE}/stable/${JWS_CONFIG_FILENAME_REMOTE}`,
    develop: `${CONFIG_URL_REMOTE_BASE}/develop/${JWS_CONFIG_FILENAME_REMOTE}`,
};
