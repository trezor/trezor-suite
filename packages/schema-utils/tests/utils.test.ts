import { setDeepValue } from '../src/utils';

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
});
