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
type GetNewOriginBoundStateStateCallback = (currentState: OriginBoundState) => OriginBoundState;

let memoryStorage: Store = getEmptyState();

const getPermanentStorage = () => {
    const ls = localStorage.getItem(storageName);

    return ls ? JSON.parse(ls) : getEmptyState();
};

interface Events {
    changed: Store;
}

class Storage extends TypedEmitter<Events> {
    public save(getNewState: GetNewStateCallback, temporary = false) {
        if (temporary || !global.window) {
            memoryStorage = getNewState(memoryStorage);

            return;
        }

        try {
            const newState = getNewState(getPermanentStorage());
            localStorage.setItem(storageName, JSON.stringify(newState));
            this.emit('changed', newState);
        } catch (err) {
            // memory storage is fallback of the last resort
            console.warn('long term storage not available');
            memoryStorage = getNewState(memoryStorage);
        }
    }

    public saveForOrigin(
        getNewState: GetNewOriginBoundStateStateCallback,
        origin: string,
        temporary = false,
    ) {
        this.save(
            state => ({
                ...state,
                origin: {
                    ...state.origin,
                    [origin]: getNewState(state.origin?.[origin] || {}),
                },
            }),
            temporary,
        );
    }

    public load(temporary = false): Store {
        if (temporary || !global?.window?.localStorage) {
            return memoryStorage;
        }

        try {
            return getPermanentStorage();
        } catch (err) {
            // memory storage is fallback of the last resort
            console.warn('long term storage not available');
            return memoryStorage;
        }
    }

    public loadForOrigin(origin: string, temporary = false): OriginBoundState {
        const state = this.load(temporary);

        return state.origin?.[origin] || {};
    }
}

const storage = new Storage();
export { storage };
