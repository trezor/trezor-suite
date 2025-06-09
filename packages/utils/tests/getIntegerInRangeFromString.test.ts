import { getIntegerInRangeFromString } from '../src/getIntegerInRangeFromString';

describe('getIntegerInRangeFromString', () => {
    it('should always produce the same number for the same string input', () => {
        const input = '47A2176AC04E609FD0E9811A';
        const result1 = getIntegerInRangeFromString(input, 101);
        const result2 = getIntegerInRangeFromString(input, 101);
        expect(result1).toEqual(result2);
    });

    it('should always be deterministic in producing a number from same input', () => {
        const input = 'z';
        const result1 = getIntegerInRangeFromString(input, 101);
        expect(result1).toBe(21);
    });

    it('should return a number between 0 and 100 for various inputs', () => {
        const inputs = [
            'z',
            '', // It should work with empty string as well.
            'a-much-longer-string-to-test-just-to-test-that-something-like-this-will-also-work',
            '47A2176AC04E609FD0E9811A',
            '!@#$%^&*()-and-some-other-characters-ěščřžýáíé',
            'another-device-id-456',
        ];

        inputs.forEach(input => {
            const result = getIntegerInRangeFromString(input, 101);
            expect(result).toBeGreaterThanOrEqual(0);
            expect(result).toBeLessThan(101);
        });
    });
});
