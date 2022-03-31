import * as storage from '.';

describe('storage', () => {
    beforeEach(() => {
        window.localStorage.clear();
        window.document.cookie = '';
    });

    test('window.localStorage', () => {
        expect(storage.load(storage.PERMISSIONS_KEY)).toBe(undefined);
        storage.save(storage.PERMISSIONS_KEY, []);
        expect(storage.load(storage.PERMISSIONS_KEY)).toEqual([]);
        // @ts-expect-error
        storage.save(storage.PERMISSIONS_KEY, 'not-array');
        expect(storage.load(storage.PERMISSIONS_KEY)).toEqual(undefined);

        expect(storage.load(storage.BROWSER_KEY)).toBe(undefined);
        storage.save(storage.BROWSER_KEY, true);
        expect(storage.load(storage.BROWSER_KEY)).toBe(true);
        // @ts-expect-error
        storage.save(storage.BROWSER_KEY, 'not-boolean');
        expect(storage.load(storage.BROWSER_KEY)).toBe(false);
    });

    test('window.document.cookie', () => {
        const org = window.localStorage;
        // @ts-expect-error, deactivate localStorage
        delete window.localStorage;

        expect(storage.load(storage.PERMISSIONS_KEY)).toBe(undefined);
        storage.save(storage.BROWSER_KEY, true);
        storage.save(storage.PERMISSIONS_KEY, [{ type: 'read' }]);

        expect(storage.load(storage.PERMISSIONS_KEY)).toEqual([{ type: 'read' }]);
        expect(storage.load(storage.BROWSER_KEY)).toBe(true);

        // @ts-expect-error
        storage.save(storage.PERMISSIONS_KEY, 'not-array');
        expect(storage.load(storage.PERMISSIONS_KEY)).toEqual(undefined);
        // @ts-expect-error
        storage.save(storage.BROWSER_KEY, 'not-boolean');
        expect(storage.load(storage.BROWSER_KEY)).toBe(false);

        // restore localStorage
        window.localStorage = org;
    });

    test('memoryStorage', () => {
        expect(storage.load(storage.PERMISSIONS_KEY, true)).toBe(undefined);
        storage.save(storage.PERMISSIONS_KEY, [], true);
        expect(storage.load(storage.PERMISSIONS_KEY, true)).toEqual([]);
        // @ts-expect-error
        storage.save(storage.PERMISSIONS_KEY, 'not-array', true);
        expect(storage.load(storage.PERMISSIONS_KEY, true)).toEqual(undefined);

        expect(storage.load(storage.BROWSER_KEY, true)).toBe(undefined);
        storage.save(storage.BROWSER_KEY, true, true);
        expect(storage.load(storage.BROWSER_KEY, true)).toBe(true);
        // @ts-expect-error
        storage.save(storage.BROWSER_KEY, 'not-boolean', true);
        expect(storage.load(storage.BROWSER_KEY, true)).toBe(false);
    });
});
