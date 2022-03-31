// https://github.com/trezor/connect/blob/develop/src/js/storage/index.js

export const BROWSER_KEY = 'trezorconnect_browser';
export const PERMISSIONS_KEY = 'trezorconnect_permissions';
export const CONFIRMATION_KEY = 'trezorconnect_confirmations';

// eslint-disable-next-line no-underscore-dangle
const _storage: { [k: string]: string } = {};

export const save = (storageKey: string, value: any, temporary = false) => {
    if (temporary) {
        _storage[storageKey] = JSON.stringify(value);
        return;
    }
    try {
        window.localStorage[storageKey] = JSON.stringify(value);
        return;
    } catch (ignore) {
        // empty
    }

    // Fallback cookie
    try {
        window.document.cookie = `${encodeURIComponent(storageKey)}=${JSON.stringify(value)};`;
    } catch (ignore) {
        // empty
    }
};

export const load = (storageKey: string, temporary = false): JSON | undefined => {
    let value: string | undefined;

    if (temporary) {
        value = _storage[storageKey];
        return value ? JSON.parse(value) : null;
    }

    try {
        value = window.localStorage[storageKey];
    } catch (ignore) {
        // empty
    }

    // Fallback cookie if local storage gives us nothing
    if (typeof value === 'undefined') {
        try {
            const { cookie } = window.document;
            const location = cookie.indexOf(`${encodeURIComponent(storageKey)}=`);
            if (location !== -1) {
                const matches = /^([^;]+)/.exec(cookie.slice(location));
                if (matches) {
                    [value] = matches;
                }
            }
        } catch (ignore) {
            // empty
        }
    }
    return value ? JSON.parse(value) : null;
};
