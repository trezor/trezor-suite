// https://github.com/trezor/connect/blob/develop/src/js/storage/index.js
const storageVersion = 1;
const storageName = `storage_v${storageVersion}`;

interface Permission {
    type: string;
    origin?: string;
    device?: string;
}

export interface Store {
    browser?: boolean;
    permissions?: Permission[];
    tracking_enabled?: boolean;
    tracking_id?: string;
}

type GetNewStateCallback = (currentState: Store) => Store;

let memoryStorage: Store = {};

const getPermanentStorage = () => {
    const ls = localStorage.getItem(storageName);

    return ls ? JSON.parse(ls) : {};
};

export const save = (getNewState: GetNewStateCallback, temporary = false) => {
    if (temporary || !global.window) {
        memoryStorage = getNewState(memoryStorage);

        return;
    }

    const newState = getNewState(getPermanentStorage());
    localStorage.setItem(storageName, JSON.stringify(newState));
};

export const load = (temporary = false): Store => {
    if (temporary || !global?.window?.localStorage) {
        return memoryStorage;
    }

    return getPermanentStorage();
};
