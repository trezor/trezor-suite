import { mergeDeepObject } from '../mergeDeepObject';
import { mergeDeepObjectDotNotation } from '../mergeDeepObjectDotNotation';

describe(mergeDeepObjectDotNotation.name, () => {
    const fn = () => {};
    const first = { a: { b: 1, c: 'foo' }, 'd.e': { f: null, 'g.h': 42 }, l: { m: [8] } };
    const second = { 'a.b': 3, d: { 'e.f': fn, 'e.g': true }, 'i.j.k': undefined, 'l.m': [9] };
    const third = { 'i.j': 'bar' };

    it('dot notation off in mergeDeepObject', () => {
        const result = mergeDeepObject.withOptions({ mergeArrays: false }, first, second, third);

        expect(result).toStrictEqual({ ...first, ...second, ...third });
    });

    it('dot notation on', () => {
        const result = mergeDeepObjectDotNotation(first, second, third);

        expect(result).toStrictEqual({
            a: { b: 3, c: 'foo' },
            d: { e: { f: fn, g: true } },
            i: { j: 'bar' },
            l: { m: [8, 9] },
        });
    });

    it('dot notation with options', () => {
        const result = mergeDeepObjectDotNotation.withOptions(
            { mergeArrays: false },
            first,
            second,
            third,
        );

        expect(result).toStrictEqual({
            a: { b: 3, c: 'foo' },
            d: { e: { f: fn, g: true } },
            i: { j: 'bar' },
            l: { m: [9] },
        });
    });
});
