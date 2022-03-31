// https://github.com/trezor/connect/blob/develop/src/js/storage/index.js

export const BROWSER_KEY = 'trezorconnect_browser';
export const PERMISSIONS_KEY = 'trezorconnect_permissions';

type Key = typeof BROWSER_KEY | typeof PERMISSIONS_KEY;
interface Permission {
    type: string;
    origin?: string;
    device?: string;
}

const memoryStorage: Partial<Record<Key, string>> = {};

export function save(key: typeof BROWSER_KEY, value: boolean, temporary?: boolean): void;
export function save(key: typeof PERMISSIONS_KEY, value: Permission[], temporary?: boolean): void;
export function save(storageKey: Key, value: any, temporary = false) {
    if (temporary) {
        memoryStorage[storageKey] = JSON.stringify(value);
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
}

export function load(key: typeof BROWSER_KEY, temporary?: boolean): boolean | void;
export function load(key: typeof PERMISSIONS_KEY, temporary?: boolean): Permission[] | void;
export function load(storageKey: Key, temporary = false): any {
    let value: string | undefined;

    if (temporary) {
        value = memoryStorage[storageKey];
    } else {
        try {
            value = window.localStorage[storageKey];
        } catch (ignore) {
            // empty
        }

        // Fallback cookie if local storage gives us nothing
        if (typeof value === 'undefined') {
            try {
                const { cookie } = window.document;
                const prefix = `${encodeURIComponent(storageKey)}=`;
                const location = cookie.indexOf(prefix);
                if (location !== -1) {
                    const matches = /^([^;]+)/.exec(cookie.slice(location));
                    if (matches) {
                        value = matches[0].replace(prefix, '');
                    }
                }
            } catch (ignore) {
                // empty
            }
        }
    }

    if (typeof value === 'string') {
        try {
            const json = JSON.parse(value);
            if (storageKey === PERMISSIONS_KEY) {
                return Array.isArray(json) ? json : undefined;
            }
            return typeof json === 'boolean' ? json : false;
        } catch (error) {
            // empty
        }
    }
}
