import { storage } from '..';

describe('storage', () => {
    beforeEach(() => {
        window.localStorage?.clear();
    });

    test('window.localStorage', () => {
        expect(storage.load().permissions).toBe(undefined);
        storage.save(state => ({ ...state, permissions: [] }));
        expect(storage.load().permissions).toStrictEqual([]);

        // @ts-expect-error
        expect(storage.load().random).toBe(undefined);
        storage.save(state => ({ ...state, random: {} }));
        // @ts-expect-error
        expect(storage.load().random).toStrictEqual({});
    });

    test('memoryStorage', () => {
        expect(storage.load(true).permissions).toBe(undefined);
        storage.save(state => ({ ...state, permissions: [] }), true);
        expect(storage.load(true).permissions).toStrictEqual([]);
        expect(storage.load().permissions).toBe(undefined);

        // @ts-expect-error
        expect(storage.load(true).random).toBe(undefined);
        storage.save(state => ({ ...state, random: {} }), true);
        // @ts-expect-error
        expect(storage.load(true).random).toStrictEqual({});
        // @ts-expect-error
        expect(storage.load().random).toBe(undefined);
    });

    test('!window', () => {
        // @ts-expect-error
        global.window = undefined;

        expect(storage.load().permissions).toBe(undefined);
        storage.save(state => ({ ...state, permissions: [] }));
        expect(storage.load().permissions).toStrictEqual([]);

        // @ts-expect-error
        expect(storage.load().random).toBe(undefined);
        storage.save(state => ({ ...state, random: {} }));
        // @ts-expect-error
        expect(storage.load().random).toStrictEqual({});
    });
});
