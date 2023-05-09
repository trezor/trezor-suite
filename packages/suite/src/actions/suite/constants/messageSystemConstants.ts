import { resolveStaticPath } from '@suite-common/suite-utils';

export const FETCH_CONFIG_SUCCESS = '@message-system/fetch-config-success';
export const FETCH_CONFIG_SUCCESS_UPDATE = '@message-system/fetch-config-success-update';
export const FETCH_CONFIG_ERROR = '@message-system/fetch-config-error';

export const SAVE_VALID_MESSAGES = '@message-system/save-valid-messages';
export const DISMISS_MESSAGE = '@message-system/dismiss-message';

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

export const CONFIG_URL_LOCAL = resolveStaticPath(`message-system/config.v${VERSION}.jws`);
