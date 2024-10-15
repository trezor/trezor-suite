import { randomInt } from 'crypto';

import { getRandomInt } from '../src/getRandomInt';

describe(getRandomInt.name, () => {
    it('raises same error as randomInt from crypto when max <= min', () => {
        const EXPECTED_ERROR = new RangeError(
            'The value of "max" is out of range. It must be greater than the value of "min" (0). Received -1',
        );

        expect(() => randomInt(0, -1)).toThrowError(EXPECTED_ERROR);
        expect(() => getRandomInt(0, -1)).toThrowError(EXPECTED_ERROR);
    });

    it('raises same error for unsafe integer', () => {
        const UNSAFE_INTEGER = 2 ** 53;

        const EXPECTED_ERROR_MIN = new RangeError(
            'The "min" argument must be a safe integer. Received type number (9007199254740992)',
        );

        expect(() => randomInt(UNSAFE_INTEGER, UNSAFE_INTEGER + 1)).toThrowError(
            EXPECTED_ERROR_MIN,
        );
        expect(() => getRandomInt(UNSAFE_INTEGER, UNSAFE_INTEGER + 1)).toThrowError(
            EXPECTED_ERROR_MIN,
        );

        const EXPECTED_ERROR_MAX = new RangeError(
            'The "max" argument must be a safe integer. Received type number (9007199254740992)',
        );

        expect(() => randomInt(0, UNSAFE_INTEGER)).toThrowError(EXPECTED_ERROR_MAX);
        expect(() => getRandomInt(0, UNSAFE_INTEGER)).toThrowError(EXPECTED_ERROR_MAX);
    });

    it('returns same value when range is trivial', () => {
        for (let i = 0; i < 10_000; i++) {
            expect(randomInt(0, 1)).toEqual(0);
            expect(getRandomInt(0, 1)).toEqual(0);

            expect(randomInt(100, 101)).toEqual(100);
            expect(getRandomInt(100, 101)).toEqual(100);
        }
    });

    it('return value in given range', () => {
        for (let i = 0; i < 10_000; i++) {
            const result = getRandomInt(0, 100);

            expect(Number.isInteger(result)).toBe(true);
            expect(result).toBeGreaterThanOrEqual(0);
            expect(result).toBeLessThan(100);
        }
    });
});
