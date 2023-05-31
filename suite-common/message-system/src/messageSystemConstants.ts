import { resolveStaticPath } from '@suite-common/suite-utils';

/*
 * Bump version in case the new version of message system is not backward compatible.
 */
export const VERSION = 1;

export const JWS_SIGN_ALGORITHM = 'ES256';

export const JWS_CONFIG_FILENAME = `config.v${VERSION}.jws`;

/*
 * On the app launch and then about once a minute (FETCH_INTERVAL), a new config tries to fetch.
 * FETCH_CHECK_INTERVAL is interval for checking if FETCH_INTERVAL already expired.
 */
export const FETCH_INTERVAL = 60_000; // 1 minute in milliseconds
export const FETCH_CHECK_INTERVAL = 30_000;
export const FETCH_TIMEOUT = 30_000;

export const CONFIG_URL_REMOTE = `https://data.trezor.io/config/${
    process.env.CODESIGN_BUILD ? 'stable' : 'develop'
}/${JWS_CONFIG_FILENAME}`;

export const CONFIG_URL_LOCAL = resolveStaticPath(`message-system/${JWS_CONFIG_FILENAME}`);
