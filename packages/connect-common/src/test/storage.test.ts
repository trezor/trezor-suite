import { storage } from '..';

const origin = 'foo.bar';

describe('storage', () => {
    beforeEach(() => {
        window.localStorage?.clear();
    });

    test('window.localStorage', () => {
        expect(storage.load().origin[origin].permissions).toBe(undefined);
        storage.save(state => ({ ...state }));
        expect(storage.load().origin[origin].permissions).toStrictEqual([]);
        // @ts-expect-error
        expect(storage.load().random).toBe(undefined);
        storage.save(state => ({ ...state, random: {} }));
        // @ts-expect-error
        expect(storage.load().random).toStrictEqual({});
    });

    test('memoryStorage', () => {
        expect(storage.load(true).origin[origin].permissions).toBe(undefined);
        storage.save(state => ({ ...state }), true);
        expect(storage.load(true).origin[origin].permissions).toStrictEqual([]);
        expect(storage.load().origin[origin].permissions).toBe(undefined);
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

        expect(storage.load().origin[origin].permissions).toBe(undefined);
        storage.save(state => ({ ...state, permissions: [] }));
        expect(storage.load().origin[origin].permissions).toStrictEqual([]);

        // @ts-expect-error
        expect(storage.load().random).toBe(undefined);
        storage.save(state => ({ ...state, random: {} }));
        // @ts-expect-error
        expect(storage.load().random).toStrictEqual({});
    });
});
