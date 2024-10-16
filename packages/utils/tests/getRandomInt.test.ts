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

    it('raises error for range > 2^32', () => {
        const EXPECTED_ERROR = new RangeError(
            'This function only provide 32 bits of entropy, therefore range cannot be more then 2^32.',
        );

        expect(() => getRandomInt(0, Math.pow(2, 32) + 1)).toThrowError(EXPECTED_ERROR);
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
        const EXPECTED_ERROR_MAX_NEGATIVE = new RangeError(
            'The "max" argument must be a safe integer. Received type number (-9007199254740992)',
        );

        expect(() => randomInt(0, UNSAFE_INTEGER)).toThrowError(EXPECTED_ERROR_MAX);
        expect(() => getRandomInt(0, UNSAFE_INTEGER)).toThrowError(EXPECTED_ERROR_MAX);
        expect(() => randomInt(0, -UNSAFE_INTEGER)).toThrowError(EXPECTED_ERROR_MAX_NEGATIVE);
        expect(() => getRandomInt(0, -UNSAFE_INTEGER)).toThrowError(EXPECTED_ERROR_MAX_NEGATIVE);
    });

    // This test takes 100+seconds to run. It is very needed for development and debugging,
    // but due to the time it takes, it is skipped in CI.
    it.skip('return value in given range and in uniform distribution', () => {
        const SAMPLES = 1000_000;
        const RANGE = 100;
        const MIN = 0;
        const MAX = MIN + RANGE;
        const TOLERANCE = 0.1;
        const EXPECTED = SAMPLES / RANGE;

        const LOWER_BOUND = (1 - TOLERANCE) * EXPECTED;
        const UPPER_BOUND = (1 + TOLERANCE) * EXPECTED;

        const distribution = new Map<number, number>();

        for (let i = 0; i < SAMPLES; i++) {
            const result = getRandomInt(MIN, MAX);

            distribution.set(result, (distribution.get(result) ?? 0) + 1);

            expect(Number.isInteger(result)).toBe(true);
            expect(result).toBeGreaterThanOrEqual(MIN);
            expect(result).toBeLessThan(MAX);
        }

        Array.from(distribution.keys()).forEach(key => {
            expect(distribution.get(key)).toBeGreaterThanOrEqual(LOWER_BOUND);
            expect(distribution.get(key)).toBeLessThanOrEqual(UPPER_BOUND);
        });
    });
});
