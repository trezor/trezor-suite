import { arrayToDictionary } from '../src/arrayToDictionary';

describe('arrayToDictionary', () => {
    it('array with unique keys', () => {
        const array = [
            { value: true, name: 'a' },
            { value: true, name: 'b' },
            { value: false, name: 'c' },
            { value: true, name: 'd' },
            { value: false, name: 'e' },
        ];
        const dictionary = arrayToDictionary(array, e => e.name);
        expect(dictionary).toStrictEqual({
            a: { value: true, name: 'a' },
            b: { value: true, name: 'b' },
            c: { value: false, name: 'c' },
            d: { value: true, name: 'd' },
            e: { value: false, name: 'e' },
        });
    });

    it('array with repeating keys', () => {
        const array = [
            { value: 1, name: 'a' },
            { value: 2, name: 'b' },
            { value: 3, name: 'c' },
            { value: 4, name: 'b' },
        ];
        const dictionary = arrayToDictionary(array, e => e.name);
        expect(dictionary).toStrictEqual({
            a: { value: 1, name: 'a' },
            b: { value: 4, name: 'b' },
            c: { value: 3, name: 'c' },
        });
    });

    it('array to multidictionary', () => {
        const array = [
            { value: 1, name: 'a' },
            { value: 2, name: 'b' },
            { value: 3, name: 'c' },
            { value: 4, name: 'b' },
        ];
        const dictionary = arrayToDictionary(array, e => e.name, true);
        expect(dictionary).toStrictEqual({
            a: [{ value: 1, name: 'a' }],
            b: [
                { value: 2, name: 'b' },
                { value: 4, name: 'b' },
            ],
            c: [{ value: 3, name: 'c' }],
        });
    });

    it('array to dictionary with strongly typed optional number keys', () => {
        const array = [
            { value: 1, name: 'a' } as const,
            { value: 2, name: 'b' } as const,
            { value: 3, name: 'c' } as const,
            { value: 4, name: 'b' } as const,
        ];
        const dictionary = arrayToDictionary(
            array,
            e => (e.value !== 2 ? e.value : undefined),
            true,
        );
        expect(dictionary).toStrictEqual({
            1: [{ value: 1, name: 'a' }],
            3: [{ value: 3, name: 'c' }],
            4: [{ value: 4, name: 'b' }],
        });

        // @ts-expect-error "2" key is not expected (skipped)
        expect(dictionary[2]).toBe(undefined);
        // @ts-expect-error string key is not expected
        expect(dictionary.a).toBe(undefined);
    });

    it('array to multidictionary with strongly typed optional string keys', () => {
        const array = [
            { value: 1, name: 'a' } as const,
            { value: 2, name: 'b' } as const,
            { value: 3, name: 'skip' } as const,
            { value: 4, name: 'b' } as const,
            { value: 5, name: 'skip' } as const,
        ];
        const dictionary = arrayToDictionary(
            array,
            e => (e.name !== 'skip' ? e.name : undefined),
            true,
        );
        expect(dictionary).toStrictEqual({
            a: [{ value: 1, name: 'a' }],
            b: [
                { value: 2, name: 'b' },
                { value: 4, name: 'b' },
            ],
        });

        // @ts-expect-error "skip" key is not expected (skipped)
        expect(dictionary.skip).toBe(undefined);
        // @ts-expect-error number key is not expected
        expect(dictionary[1]).toBe(undefined);
    });

    it('array with mixed keys', () => {
        const array = ['a', 'b', 0, 1];
        const dictionary = arrayToDictionary(array, e => e);
        expect(dictionary).toStrictEqual({
            a: 'a',
            b: 'b',
            0: 0,
            1: 1,
        });
        expect(dictionary.a).toEqual('a');
        expect(dictionary[0]).toEqual(0);
    });

    it('array with invalid keys returned from getKey callback', () => {
        const array = ['a', 'b', 'c'];
        const dictionary = arrayToDictionary(array, e => (e === 'a' ? { foo: 1 } : null));
        expect(dictionary).toStrictEqual({});
    });

    it('array with calculated keys', () => {
        const array = ['aalpha', 'bbeta', 'ggamma', 'ddelta'];
        const dictionary = arrayToDictionary(array, e => e.toUpperCase().slice(1));
        expect(dictionary).toStrictEqual({
            ALPHA: 'aalpha',
            BETA: 'bbeta',
            GAMMA: 'ggamma',
            DELTA: 'ddelta',
        });
    });
});
