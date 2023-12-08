/*
 * Bump version in case the new version of message system is not backward compatible.
 */
export const VERSION = 1;

export const JWS_SIGN_ALGORITHM = 'ES256';

export const JWS_CONFIG_FILENAME_REMOTE = `config.v${VERSION}.jws`;
export const JWS_CONFIG_FILENAME_LOCAL = `config.v${VERSION}.ts`;

/*
 * On the app launch and then about once a minute (FETCH_INTERVAL), a new config tries to fetch.
 * FETCH_CHECK_INTERVAL is interval for checking if FETCH_INTERVAL already expired.
 */
export const FETCH_INTERVAL = 60_000; // 1 minute in milliseconds
export const FETCH_CHECK_INTERVAL = 30_000;
export const FETCH_TIMEOUT = 30_000;

export const CONFIG_URL_REMOTE_BASE = 'https://data.trezor.io/config';
export const CONFIG_URL_REMOTE = {
    stable: `${CONFIG_URL_REMOTE_BASE}/stable/${JWS_CONFIG_FILENAME_REMOTE}`,
    develop: `${CONFIG_URL_REMOTE_BASE}/develop/${JWS_CONFIG_FILENAME_REMOTE}`,
};
