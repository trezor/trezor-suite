import { storage } from '..';

const origin = 'foo.bar';

describe('storage', () => {
    beforeEach(() => {
        window.localStorage?.clear();
    });

    test('window.localStorage', () => {
        expect(storage.load().browser).toBe(undefined);
        storage.save(state => ({ ...state, browser: true }));
        expect(storage.load().browser).toStrictEqual(true);
        // @ts-expect-error
        expect(storage.load().random).toBe(undefined);
        storage.save(state => ({ ...state, random: {} }));
        // @ts-expect-error
        expect(storage.load().random).toStrictEqual({});
    });

    test('memoryStorage', () => {
        expect(storage.load(true).browser).toBe(undefined);
        storage.save(state => ({ ...state, browser: true }), true);
        expect(storage.load(true).browser).toStrictEqual(true);
        expect(storage.load().browser).toBe(undefined);
        // @ts-expect-error
        expect(storage.load(true).random).toBe(undefined);
        storage.save(state => ({ ...state, random: {} }), true);
        // @ts-expect-error
        expect(storage.load(true).random).toStrictEqual({});
        // @ts-expect-error
        expect(storage.load().random).toBe(undefined);
    });

    test('storage.saveForOrigin', () => {
        storage.saveForOrigin(state => ({ ...state, permissions: [] }), origin);
        expect(storage.load().origin[origin].permissions).toStrictEqual([]);
        storage.saveForOrigin(
            state => ({ ...state, permissions: [{ type: 'a', device: 'b' }] }),
            origin,
        );
        expect(storage.load().origin[origin].permissions).toStrictEqual([
            { type: 'a', device: 'b' },
        ]);
    });

    test('storage.loadForOrigin', () => {
        storage.saveForOrigin(state => ({ ...state, permissions: [] }), origin);
        expect(storage.loadForOrigin(origin).permissions).toStrictEqual([]);
        storage.saveForOrigin(
            state => ({ ...state, permissions: [{ type: 'a', device: 'b' }] }),
            origin,
        );
        expect(storage.loadForOrigin(origin).permissions).toStrictEqual([
            { type: 'a', device: 'b' },
        ]);
    });
});
