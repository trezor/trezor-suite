import { isNewerOrEqual } from '@trezor/utils/src/versionUtils';

import { ConnectSettings } from '../types/settings';

export const CONNECT_DEPRECATION_WARNING =
    'Trezor Connect 9 is deprecated and its support ends on December 31, 2026. Please migrate to Trezor Connect 10: https://connect.trezor.io/10/guides/migrating-to-connect-10';

const MAX_APP_NAME_LENGTH = 64;

/**
 * Name of the application which called Connect, suitable for displaying in the popup.
 * `hostLabel` is assigned by Connect for known hosts, `manifest.appName` is declared by the caller.
 */
export const getCallerAppName = (settings?: ConnectSettings): string | undefined => {
    const appName = settings?.manifest?.appName?.trim();
    const truncatedAppName =
        appName && appName.length > MAX_APP_NAME_LENGTH
            ? `${appName.slice(0, MAX_APP_NAME_LENGTH)}…`
            : appName;

    return settings?.hostLabel || truncatedAppName || settings?.origin;
};

export const isConnectOutdated = (settings?: ConnectSettings): false | 'error' | 'warning' => {
    // web only for now
    if (settings?.env !== 'web') return false;

    // npmVersion missing - pinned iframe version or core-in-popup.
    // we expect that if the version is pinned, the NPM version is equal to iframe version
    const version = settings.npmVersion || settings.version;
    if (!isNewerOrEqual(version, '9.2.1')) return 'error';
    if (!isNewerOrEqual(version, '9.5.0')) return 'warning';

    return false;
};
