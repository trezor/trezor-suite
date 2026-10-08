import { type Db } from 'src/storage/createDb';

import { createIdbRuntimeNetworkPreferencesStore } from './createIdbRuntimeNetworkPreferencesStore';

const stored = { userDefinitions: [{ symbol: 'abc' }], enabled: ['user:abc' as const] };

const createDb = (item: unknown = stored, isAccessible = true) =>
    ({
        isSupported: () => true,
        isAccessible: () => isAccessible,
        getItemByPK: jest.fn(() => Promise.resolve(item)),
        addItem: jest.fn(() => Promise.resolve('preferences')),
    }) as unknown as Db & { addItem: jest.Mock; getItemByPK: jest.Mock };

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

describe(createIdbRuntimeNetworkPreferencesStore.name, () => {
    it('loads the stored preferences and publishes them', async () => {
        const db = createDb();
        const store = createIdbRuntimeNetworkPreferencesStore({ db, onStorageError: jest.fn() });
        const listener = jest.fn();
        store.subscribe(listener);

        expect(store.getSnapshot()).toEqual({ userDefinitions: [], enabled: [] });
        await flush();

        expect(db.getItemByPK).toHaveBeenCalledWith('runtimeNetworkPreferences', 'preferences');
        expect(store.getSnapshot()).toEqual(stored);
        expect(listener).toHaveBeenCalledTimes(1);
        expect(db.addItem).not.toHaveBeenCalled();
    });

    it("writes back the user's changes", async () => {
        const db = createDb(null);
        const store = createIdbRuntimeNetworkPreferencesStore({ db, onStorageError: jest.fn() });
        await flush();

        store.setEnabled('trezor:xyz', true);

        expect(db.addItem).toHaveBeenCalledWith(
            'runtimeNetworkPreferences',
            { userDefinitions: [], enabled: ['trezor:xyz'] },
            'preferences',
            true,
        );
    });

    it('keeps changes in memory while the database is not accessible', async () => {
        const db = createDb(null, false);
        const store = createIdbRuntimeNetworkPreferencesStore({ db, onStorageError: jest.fn() });
        await flush();

        store.addUserDefinition({ symbol: 'abc' });

        expect(db.addItem).not.toHaveBeenCalled();
        expect(store.getSnapshot().userDefinitions).toEqual([{ symbol: 'abc' }]);
    });

    it('reports a failed read without the preferences', async () => {
        const db = createDb();
        const error = new Error('blocked');
        db.getItemByPK.mockRejectedValueOnce(error);
        const onStorageError = jest.fn();

        createIdbRuntimeNetworkPreferencesStore({ db, onStorageError });
        await flush();

        expect(onStorageError).toHaveBeenCalledWith(error);
    });
});
