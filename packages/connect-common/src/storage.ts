// https://github.com/trezor/connect/blob/develop/src/js/storage/index.js

import { TypedEmitter } from '@trezor/utils/lib/typedEventEmitter';

const storageVersion = 2;
const storageName = `storage_v${storageVersion}`;

export interface Permission {
    type: string;
    device?: string;
}

/**
 * remembered:
 *  - physical device from webusb pairing dialogue
 *  - passphrase to be used
 */
export interface PreferredDevice {
    path: string;
    state?: string;
    instance?: number;
}

export interface OriginBoundState {
    permissions?: Permission[];
    preferredDevice?: PreferredDevice;
}

export interface GlobalState {
    tracking_enabled?: boolean;
    tracking_id?: string;
    browser?: boolean;
}

export type Store = GlobalState & {
    origin: { [origin: string]: OriginBoundState };
};

// TODO: move storage somewhere else. Having it here brings couple of problems:
// - We can not import types from connect (would cause cyclic dependency)
// - it has here dependency on window object, not good

const getEmptyState = (): Store => ({
    origin: {},
});
type GetNewStateCallback = (currentState: Store) => Store;

let memoryStorage: Store = getEmptyState();

const getPermanentStorage = () => {
    const ls = localStorage.getItem(storageName);

    return ls ? JSON.parse(ls) : getEmptyState();
};

const save = (getNewState: GetNewStateCallback, temporary = false) => {
    if (temporary || !global.window) {
        memoryStorage = getNewState(memoryStorage);

        return;
    }

    try {
        const newState = getNewState(getPermanentStorage());
        localStorage.setItem(storageName, JSON.stringify(newState));
    } catch (err) {
        // memory storage is fallback of the last resort
        console.warn('long term storage not awailable');
        memoryStorage = getNewState(memoryStorage);
    }
};

const load = (temporary = false): Store => {
    if (temporary || !global?.window?.localStorage) {
        return memoryStorage;
    }

    try {
        return getPermanentStorage();
    } catch (err) {
        // memory storage is fallback of the last resort
        console.warn('long term storage not awailable');
        return memoryStorage;
    }
};

const loadForOrigin = (origin: string, temporary = false): OriginBoundState => {
    const state = load(temporary);

    return state.origin?.[origin] || {};
};

interface Events {
    changed: Store;
}

class Storage extends TypedEmitter<Events> {
    public save = save;
    public load = load;
    public loadForOrigin = loadForOrigin;
}

const storage = new Storage();
export { storage };
