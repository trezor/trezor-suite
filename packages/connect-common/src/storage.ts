// https://github.com/trezor/connect/blob/develop/src/js/storage/index.js
const storageVersion = 1;
const storageName = `storage_v${storageVersion}`;

export const BROWSER_KEY = 'browser';
export const PERMISSIONS_KEY = 'permissions';

interface Permission {
    type: string;
    origin?: string;
    device?: string;
}

export interface Store {
    [BROWSER_KEY]?: boolean;
    [PERMISSIONS_KEY]?: Permission[];
}

type GetNewStateCallback = (currentState: Store) => Store;

let memoryStorage: Store = {};

const getPermanentStorage = () => {
    const ls = localStorage.getItem(storageName);

    return ls ? JSON.parse(ls) : {};
};

export const save = (getNewState: GetNewStateCallback, temporary = false) => {
    if (temporary) {
        memoryStorage = getNewState(memoryStorage);

        return;
    }

    const newState = getNewState(getPermanentStorage());
    localStorage.setItem(storageName, JSON.stringify(newState));
};

export const load = (temporary = false): Store => {
    if (temporary) {
        return memoryStorage;
    }

    return getPermanentStorage();
};
