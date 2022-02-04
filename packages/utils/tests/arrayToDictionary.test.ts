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
