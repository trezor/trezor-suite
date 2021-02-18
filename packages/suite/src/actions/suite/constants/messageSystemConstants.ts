import { resolveStaticPath } from '@suite-utils/build';

export const FETCH_CONFIG_SUCCESS = '@message-system/fetch-config-success';
export const FETCH_CONFIG_SUCCESS_UPDATE = '@message-system/fetch-config-success-update';
export const FETCH_CONFIG_ERROR = '@message-system/fetch-config-error';

export const SAVE_VALID_MESSAGES = '@message-system/save-valid-messages';
export const DISMISS_MESSAGE = '@message-system/dismiss-message';

/*
 * On launch of application and then every 6 hours, a new config tries to fetch.
 * However, there could be inconsistent behavior of window.setInterval implementation in various
 * runtime environments during the time a user puts his computer asleep or a browser pauses its tab.
 * Therefore, every 1 hour the message system fetching interval is checked.
 */
export const FETCH_INTERVAL = 21600000; // 6 hours in milliseconds
export const FETCH_CHECK_INTERVAL = 3600000; // 1 hour in milliseconds

/*
 * Bump version in case the new version of message system is not backward compatible.
 * Have to be in sync with version in 'suite-data' package in message-system index file.
 */
export const VERSION = 1;

export const CONFIG_URL_REMOTE = process.env.CODESIGN_BUILD
    ? `https://data.trezor.io/config/stable/config.v${VERSION}.jws`
    : `https://data.trezor.io/config/develop/config.v${VERSION}.jws`;

export const CONFIG_URL_LOCAL = resolveStaticPath(`message-system/config.v${VERSION}.jws`);
