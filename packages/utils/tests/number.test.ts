import { clamp, roundTo } from '../src/number';

describe('clamp', () => {
    it('value within bounds', () => {
        expect(clamp(5, 0, 10)).toBe(5);
    });

    it('value below min', () => {
        expect(clamp(-5, 0, 10)).toBe(0);
    });

    it('value above max', () => {
        expect(clamp(15, 0, 10)).toBe(10);
    });

    it('default bounds', () => {
        expect(clamp(0)).toBe(0);
        expect(clamp(-100)).toBe(-100);
        expect(clamp(100)).toBe(100);
    });

    it('value below custom min', () => {
        expect(clamp(5, 10, 20)).toBe(10);
    });

    it('value above custom max', () => {
        expect(clamp(25, 10, 20)).toBe(20);
    });
});

describe('roundTo', () => {
    it('rounds to 2 decimal places by default', () => {
        expect(roundTo(1.235)).toBe(1.24);
        expect(roundTo(1.234)).toBe(1.23);
    });

    it('rounds to specified precision', () => {
        expect(roundTo(1.2345, 3)).toBe(1.235);
        expect(roundTo(123.456, 0)).toBe(123);
    });
});
