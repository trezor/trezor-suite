import { clamp } from '../numberUtils';

describe('numberUtils', () => {
    it('clamp - value within bounds', () => {
        expect(clamp(5, 0, 10)).toBe(5);
    });

    it('clamp - value below min', () => {
        expect(clamp(-5, 0, 10)).toBe(0);
    });

    it('clamp - value above max', () => {
        expect(clamp(15, 0, 10)).toBe(10);
    });

    it('clamp - default bounds', () => {
        expect(clamp(0)).toBe(0);
        expect(clamp(-100)).toBe(-100);
        expect(clamp(100)).toBe(100);
    });

    it('clamp - value below custom min', () => {
        expect(clamp(5, 10, 20)).toBe(10);
    });

    it('clamp - value above custom max', () => {
        expect(clamp(25, 10, 20)).toBe(20);
    });
});
