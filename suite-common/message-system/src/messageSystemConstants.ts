import { resolveStaticPath } from '@suite-common/suite-utils';

/*
 * On the app launch and then about once a minute (FETCH_INTERVAL), a new config tries to fetch.
 * FETCH_CHECK_INTERVAL is interval for checking if FETCH_INTERVAL already expired.
 */
export const FETCH_INTERVAL = 60_000; // 1 minute in milliseconds
export const FETCH_CHECK_INTERVAL = 30_000;
export const FETCH_TIMEOUT = 30_000;

/*
 * Bump version in case the new version of message system is not backward compatible.
 * Have to be in sync with version in 'suite-data' package in message-system index file.
 */
export const VERSION = 1;

export const CONFIG_URL_REMOTE = process.env.CODESIGN_BUILD
    ? `https://data.trezor.io/config/stable/config.v${VERSION}.jws`
    : `https://data.trezor.io/config/develop/config.v${VERSION}.jws`;

export const CONFIG_URL_LOCAL = resolveStaticPath(`message-system/config.v${VERSION}.jws`); // TODO how to deal with resolveStaticPath?
