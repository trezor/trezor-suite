import { setDeepValue } from './utils';

describe('setDeepValue', () => {
    it('sets a deep value in an object', () => {
        const obj = {};
        setDeepValue(obj, ['a', 'b', 'c'], 123);
        expect(obj).toEqual({ a: { b: { c: 123 } } });
    });

    it('overwrites existing values', () => {
        const obj = { a: { b: { c: 123 } } };
        setDeepValue(obj, ['a', 'b', 'c'], 456);
        expect(obj).toEqual({ a: { b: { c: 456 } } });
    });

    it('creates intermediate objects if necessary', () => {
        const obj = {};
        setDeepValue(obj, ['a', 'b', 'c'], 123);
        expect(obj).toEqual({ a: { b: { c: 123 } } });
    });

    it.each([
        { path: ['__proto__', 'polluted'], value: true },
        { path: ['constructor', 'prototype', 'polluted'], value: true },
        { path: ['__proto__'], value: { polluted: true } },
    ])('does not follow or set a key that leads to a prototype: $path', ({ path, value }) => {
        const obj = {};

        try {
            setDeepValue(obj, path, value);

            expect(({} as Record<string, unknown>).polluted).toBeUndefined();
            expect(Object.getPrototypeOf(obj)).toBe(Object.prototype);
            expect(obj).toEqual({});
        } finally {
            // Keeps a regression from leaking into the other tests of this worker.
            delete (Object.prototype as Record<string, unknown>).polluted;
        }
    });
});
