import { getWeakRandomInt } from '../src';

describe(getWeakRandomInt.name, () => {
    it('raises same error as randomInt from crypto when max <= min', () => {
        const EXPECTED_ERROR = new RangeError(
            'The value of "max" is out of range. It must be greater than the value of "min" (0). Received -1',
        );

        expect(() => getWeakRandomInt(0, -1)).toThrowError(EXPECTED_ERROR);
    });

    it('returns same value when range is trivial', () => {
        expect(getWeakRandomInt(0, 1)).toEqual(0);
        expect(getWeakRandomInt(100, 101)).toEqual(100);
    });

    it('returns same value when range is trivial', () => {
        for (let i = 0; i < 10_000; i++) {
            const result = getWeakRandomInt(0, 100);

            expect(Number.isInteger(result)).toBe(true);
            expect(result).toBeGreaterThanOrEqual(0);
            expect(result).toBeLessThan(100);
        }
    });
});
