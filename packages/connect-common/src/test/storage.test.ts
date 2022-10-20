import { storage } from '..';

describe('storage', () => {
    beforeEach(() => {
        window.localStorage?.clear();
    });

    test('window.localStorage', () => {
        expect(storage.load()[storage.PERMISSIONS_KEY]).toBe(undefined);
        storage.save(state => ({ ...state, [storage.PERMISSIONS_KEY]: [] }));
        expect(storage.load()[storage.PERMISSIONS_KEY]).toStrictEqual([]);

        // @ts-expect-error
        expect(storage.load().random).toBe(undefined);
        storage.save(state => ({ ...state, random: {} }));
        // @ts-expect-error
        expect(storage.load().random).toStrictEqual({});
    });

    test('memoryStorage', () => {
        expect(storage.load(true)[storage.PERMISSIONS_KEY]).toBe(undefined);
        storage.save(state => ({ ...state, [storage.PERMISSIONS_KEY]: [] }), true);
        expect(storage.load(true)[storage.PERMISSIONS_KEY]).toStrictEqual([]);
        expect(storage.load()[storage.PERMISSIONS_KEY]).toBe(undefined);

        // @ts-expect-error
        expect(storage.load(true).random).toBe(undefined);
        storage.save(state => ({ ...state, random: {} }), true);
        // @ts-expect-error
        expect(storage.load(true).random).toStrictEqual({});
        // @ts-expect-error
        expect(storage.load().random).toBe(undefined);
    });
});
