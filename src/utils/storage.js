/* @flow */

// Copy-paste from mytrezor (old wallet)
// https://github.com/satoshilabs/mytrezor/blob/develop/app/scripts/storage/BackendLocalStorage.js
export const getStoragePath = (): string => {
    const regexHash = /^([^#]*)#.*$/;
    const path = window.location.href.replace(regexHash, '$1');
    const regexStart = /^[^:]*:\/\/[^/]*\//;
    return path.replace(regexStart, '/');
};

export const STORAGE_PATH: string = getStoragePath();

type StorageType = 'local' | 'session';

export const get: <T>(type: StorageType, key: string) => T | null = (type, key) => {
    const storage = type === 'local' ? window.localStorage : window.sessionStorage;
    try {
        return storage.getItem(key);
    } catch (error) {
        console.warn(`Get ${type} storage: ${error}`);
        return null;
    }
};

export const set = (type: StorageType, key: string, value: string | number | boolean): void => {
    const storage = type === 'local' ? window.localStorage : window.sessionStorage;
    try {
        storage.setItem(key, value);
    } catch (error) {
        console.warn(`Save ${type} storage: ${error}`);
    }
};

export const remove = (type: StorageType, key: string): void => {
    const storage = type === 'local' ? window.localStorage : window.sessionStorage;
    try {
        storage.removeItem(key);
    } catch (error) {
        console.warn(`Remove ${type} storage: ${error}`);
    }
};

export const clearAll = (type: ?StorageType): void => {
    let clearLocal: boolean = true;
    let clearSession: boolean = true;
    if (typeof type === 'string') {
        clearLocal = type === 'local';
        clearSession = !clearLocal;
    }

    try {
        if (clearLocal) {
            Object.keys(window.localStorage).forEach(key => key.indexOf(STORAGE_PATH) >= 0 && window.localStorage.removeItem(key));
        }
        if (clearSession) {
            Object.keys(window.sessionStorage).forEach(key => key.indexOf(STORAGE_PATH) >= 0 && window.sessionStorage.removeItem(key));
        }
    } catch (error) {
        console.error(`Clearing sessionStorage error: ${error}`);
    }
};