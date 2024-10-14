import { randomInt } from 'crypto';

import { getRandomInt } from '../src';

describe(getRandomInt.name, () => {
    it('raises same error as randomInt from crypto when max <= min', () => {
        const EXPECTED_ERROR = new RangeError(
            'The value of "max" is out of range. It must be greater than the value of "min" (0). Received -1',
        );

        expect(() => randomInt(0, -1)).toThrowError(EXPECTED_ERROR);
        expect(() => getRandomInt(0, -1)).toThrowError(EXPECTED_ERROR);
    });

    it('returns same value when range is trivial', () => {
        expect(randomInt(0, 1)).toEqual(0);
        expect(getRandomInt(0, 1)).toEqual(0);

        expect(randomInt(100, 101)).toEqual(100);
        expect(getRandomInt(100, 101)).toEqual(100);
    });

    it('returns same value when range is trivial', () => {
        for (let i = 0; i < 10_000; i++) {
            const result = getRandomInt(0, 100);
            expect(result).toBeGreaterThanOrEqual(0);
            expect(result).toBeLessThan(100);
        }
    });
});
