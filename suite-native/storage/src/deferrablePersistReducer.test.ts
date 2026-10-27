import { configureStore, createSlice } from '@reduxjs/toolkit';
import { persistStore } from 'redux-persist';

import { createDeferrablePersistStorage } from './createDeferrablePersistStorage';
import { createMMKVStorageMock } from './mmkvStorage.mock';
import { preparePersistReducer } from './typedPersistReducer';

const accountsSlice = createSlice({
    name: 'accounts',
    initialState: { accounts: [] as string[] },
    reducers: {
        addAccount: (state: { accounts: string[] }, { payload }: { payload: string }) => {
            state.accounts.push(payload);
        },
    },
});

const createInMemoryMMKVStorage = () => {
    const stored = new Map<string, string>();
    const mmkvStorage = createMMKVStorageMock();
    jest.mocked(mmkvStorage.setItem).mockImplementation((key: string, value: string) => {
        stored.set(key, value);

        return Promise.resolve(true);
    });
    jest.mocked(mmkvStorage.getItem).mockImplementation((key: string) =>
        Promise.resolve(stored.get(key)),
    );

    return mmkvStorage;
};

const createPersistedStore = (storage: Parameters<typeof preparePersistReducer>[0]['storage']) => {
    const store = configureStore({
        reducer: preparePersistReducer({
            reducer: accountsSlice.reducer,
            persistedKeys: ['accounts'],
            key: 'root',
            version: 1,
            storage,
        }),
        middleware: getDefaultMiddleware => getDefaultMiddleware({ serializableCheck: false }),
    });
    const persistor = persistStore(store);

    return { store, persistor };
};

const waitForPersistence = () => new Promise(resolve => setTimeout(resolve, 20));

describe('persisted reducer with a deferrable storage', () => {
    it('writes many updates once and stores them in the default format', async () => {
        const mmkvStorage = createInMemoryMMKVStorage();
        const deferrablePersistStorage = createDeferrablePersistStorage({ mmkvStorage });
        const { store } = createPersistedStore(deferrablePersistStorage);
        await waitForPersistence();
        jest.mocked(mmkvStorage.setItem).mockClear();

        deferrablePersistStorage.deferWrites();
        for (let index = 0; index < 50; index++) {
            store.dispatch(accountsSlice.actions.addAccount(`account-${index}`));
            await waitForPersistence();
        }

        expect(mmkvStorage.setItem).not.toHaveBeenCalled();

        await deferrablePersistStorage.resumeWrites();

        expect(mmkvStorage.setItem).toHaveBeenCalledTimes(1);

        // A store with the default serialization restores what the deferrable storage wrote.
        const { store: restoredStore } = createPersistedStore(mmkvStorage);
        await waitForPersistence();

        expect(restoredStore.getState().accounts).toHaveLength(50);
    });
});
