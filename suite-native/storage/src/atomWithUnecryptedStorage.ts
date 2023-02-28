import { MMKV } from 'react-native-mmkv';

import { atomWithStorage, createJSONStorage } from 'jotai/utils';

import { MMKV_STORAGE_ID } from './storage';

const unecryptedJotaiStorage = new MMKV({
    id: MMKV_STORAGE_ID,
});
function getItem<T>(key: string): T | null {
    const value = unecryptedJotaiStorage.getString(key);
    return value ? JSON.parse(value) : null;
}

function setItem<T>(key: string, value: T): void {
    unecryptedJotaiStorage.set(key, JSON.stringify(value));
}

function removeItem(key: string): void {
    unecryptedJotaiStorage.delete(key);
}

function clearAll(): void {
    unecryptedJotaiStorage.clearAll();
}

export const atomWithUnecryptedStorage = <T>(key: string, initialValue: T) =>
    atomWithStorage<T>(
        key,
        initialValue,
        createJSONStorage<T>(() => ({
            getItem,
            setItem,
            removeItem,
            clearAll,
        })),
    );
