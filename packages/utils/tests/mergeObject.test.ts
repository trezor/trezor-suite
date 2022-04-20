import { mergeObject } from '../src/mergeObject';

const fixtures = [
    ['simple merge', { a: 1, b: { a: 1 } }, { c: { a: 1 } }, { a: 1, b: { a: 1 }, c: { a: 1 } }],
    ['second override first', { a: 'a', b: 'x' }, { c: 'c', b: 'y' }, { a: 'a', b: 'y', c: 'c' }],
    ['object with array', { a: [1, 2], d: 4 }, { a: { b: 'c' }, d: [] }, { a: { b: 'c' }, d: [] }],
    [
        'nulls and undefineds',
        { a: 1, b: undefined, d: 2 },
        { a: null, b: null, c: undefined },
        { a: null, b: null, c: undefined, d: 2 },
    ],
] as const;

describe('mergeObject', () => {
    describe('should deep merge two objects', () => {
        fixtures.forEach(([description, target, source, expected]) =>
            it(description, () => {
                expect(mergeObject(target, source)).toEqual(expected);
            }),
        );
    });
});
