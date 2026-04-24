import { getRandomString } from '../src/getRandomString';

describe(getRandomString.name, () => {
    it('returns a string of the requested length', () => {
        expect(getRandomString(1)).toHaveLength(1);
        expect(getRandomString(12)).toHaveLength(12);
        expect(getRandomString(128)).toHaveLength(128);
    });

    it('uses the default alphanumeric alphabet', () => {
        expect(getRandomString(500)).toMatch(/^[A-Za-z0-9]+$/);
    });

    it('uses the provided alphabet', () => {
        expect(getRandomString(64, '0123456789abcdef')).toMatch(/^[0-9a-f]{64}$/);
    });

    it('throws for invalid length', () => {
        expect(() => getRandomString(0)).toThrow(RangeError);
        expect(() => getRandomString(-1)).toThrow(RangeError);
        expect(() => getRandomString(1.5)).toThrow(RangeError);
        expect(() => getRandomString(Number.NaN)).toThrow(RangeError);
    });

    it('throws for an alphabet that is too short', () => {
        expect(() => getRandomString(10, 'a')).toThrow(RangeError);
        expect(() => getRandomString(10, '')).toThrow(RangeError);
    });

    it('produces distinct values across calls', () => {
        const samples = new Set(Array.from({ length: 100 }, () => getRandomString(16)));
        expect(samples.size).toBe(100);
    });
});
