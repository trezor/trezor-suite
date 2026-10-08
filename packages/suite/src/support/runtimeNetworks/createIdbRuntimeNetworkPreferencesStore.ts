import {
    type RuntimeNetworkPreferencesStore,
    createInMemoryRuntimeNetworkPreferencesStore,
} from '@trezor/network-module-suite-common-types';

import { type Db } from 'src/storage/createDb';

const STORE = 'runtimeNetworkPreferences';
const KEY = 'preferences';

export type IdbRuntimeNetworkPreferencesStoreDeps = {
    db: Db;

    /** Reports a failed read or write, never the preferences themselves. */
    onStorageError: (error: unknown) => void;
};

export type IdbRuntimeNetworkPreferencesStore = RuntimeNetworkPreferencesStore;

/**
 * The web and desktop apps keep runtime network preferences in their own IndexedDB store, outside
 * Redux. They are held in memory, loaded once at start (empty until then) and written back on each
 * change. Without IndexedDB they last only until the app closes.
 */
export const createIdbRuntimeNetworkPreferencesStore = (
    deps: IdbRuntimeNetworkPreferencesStoreDeps,
): IdbRuntimeNetworkPreferencesStore => {
    const store = createInMemoryRuntimeNetworkPreferencesStore({
        onChange: preferences => {
            if (!deps.db.isAccessible()) return;
            deps.db.addItem(STORE, preferences, KEY, true).catch(deps.onStorageError);
        },
    });

    if (deps.db.isSupported()) {
        deps.db
            .getItemByPK(STORE, KEY)
            .then(preferences => {
                if (preferences) store.replace(preferences);
            })
            .catch(deps.onStorageError);
    }

    return {
        getSnapshot: store.getSnapshot,
        subscribe: store.subscribe,
        addUserDefinition: store.addUserDefinition,
        removeUserDefinition: store.removeUserDefinition,
        setEnabled: store.setEnabled,
    };
};
