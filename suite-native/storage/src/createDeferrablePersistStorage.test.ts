import { createDeferrablePersistStorage } from './createDeferrablePersistStorage';
import { createMMKVStorageMock } from './mmkvStorage.mock';

const ROOT_KEY = 'persist:root';

const createStorage = () => {
    const stored = new Map<string, string>();
    const mmkvStorage = createMMKVStorageMock();
    jest.mocked(mmkvStorage.setItem).mockImplementation((key: string, value: string) => {
        stored.set(key, value);

        return Promise.resolve(true);
    });
    jest.mocked(mmkvStorage.getItem).mockImplementation((key: string) =>
        Promise.resolve(stored.get(key)),
    );

    return { stored, mmkvStorage, storage: createDeferrablePersistStorage({ mmkvStorage }) };
};

const firstState = { wallet: { accounts: ['first'] }, _persist: { version: 5, rehydrated: true } };
const lastState = { wallet: { accounts: ['last'] }, _persist: { version: 5, rehydrated: true } };

describe(createDeferrablePersistStorage.name, () => {
    it('stores the state in the default redux-persist format', async () => {
        const { stored, storage } = createStorage();

        await storage.setItem(ROOT_KEY, firstState);

        expect(stored.get(ROOT_KEY)).toBe(
            JSON.stringify({
                wallet: JSON.stringify(firstState.wallet),
                _persist: JSON.stringify(firstState._persist),
            }),
        );
        await expect(storage.getItem(ROOT_KEY)).resolves.toEqual(firstState);
    });

    it('reads the state stored by the default redux-persist serialization', async () => {
        const { stored, storage } = createStorage();
        stored.set(ROOT_KEY, JSON.stringify({ wallet: JSON.stringify(firstState.wallet) }));

        await expect(storage.getItem(ROOT_KEY)).resolves.toEqual({ wallet: firstState.wallet });
    });

    it('writes only the latest deferred state, once, when the writes resume', async () => {
        const { mmkvStorage, stored, storage } = createStorage();

        storage.deferWrites();
        await storage.setItem(ROOT_KEY, firstState);
        await storage.setItem(ROOT_KEY, lastState);

        expect(mmkvStorage.setItem).not.toHaveBeenCalled();
        await expect(storage.getItem(ROOT_KEY)).resolves.toBe(lastState);

        await storage.resumeWrites();

        expect(mmkvStorage.setItem).toHaveBeenCalledTimes(1);
        expect(JSON.parse(JSON.parse(stored.get(ROOT_KEY)!).wallet)).toEqual(lastState.wallet);

        await storage.setItem(ROOT_KEY, firstState);
        expect(mmkvStorage.setItem).toHaveBeenCalledTimes(2);
    });

    it('keeps deferring after flushing the deferred state', async () => {
        const { mmkvStorage, storage } = createStorage();

        storage.deferWrites();
        await storage.setItem(ROOT_KEY, firstState);
        await storage.flushWrites();
        await storage.setItem(ROOT_KEY, lastState);

        expect(mmkvStorage.setItem).toHaveBeenCalledTimes(1);
    });

    it('drops the deferred state of a removed key', async () => {
        const { mmkvStorage, storage } = createStorage();

        storage.deferWrites();
        await storage.setItem(ROOT_KEY, firstState);
        await storage.removeItem(ROOT_KEY);
        await storage.resumeWrites();

        expect(mmkvStorage.setItem).not.toHaveBeenCalled();
        expect(mmkvStorage.removeItem).toHaveBeenCalledWith(ROOT_KEY);
    });
});
