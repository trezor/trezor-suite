import { BigNumber } from '../src/bigNumber';
import { isApproxEqual } from '../src/isApproxEqual';

describe(isApproxEqual.name, () => {
    it('always returns true for equal values', () => {
        expect(isApproxEqual(100, 100, 0.001)).toBe(true);
        expect(isApproxEqual(100, '100', 0.001)).toBe(true);
        expect(isApproxEqual('100', '100', 0.001)).toBe(true);
        expect(isApproxEqual(new BigNumber(-123), '-123', 0.001)).toBe(true);
        expect(isApproxEqual('-123.001', '-123.001000', 0.001)).toBe(true);
    });

    it('handles zero values correctly', () => {
        expect(isApproxEqual(0, 0, 0.01)).toBe(true);
        expect(isApproxEqual(0, 1, 0.01)).toBe(false);
    });

    it('handles relative tolerance', () => {
        expect(isApproxEqual(100, 101, 0.005)).toBe(false);
        expect(isApproxEqual(100, 101, 0.01)).toBe(true);
        expect(isApproxEqual(100, 101, 0.02)).toBe(true);
    });

    it('handles NaN values', () => {
        expect(isApproxEqual(100, NaN, 0.01)).toBe(false);
        expect(isApproxEqual(NaN, 100, 0.01)).toBe(false);
        expect(isApproxEqual(NaN, NaN, 0.01)).toBe(false);
        expect(isApproxEqual('nonsense', '123', 0.01)).toBe(false);
        expect(isApproxEqual('123', 'nonsense', 0.01)).toBe(false);
        expect(isApproxEqual('nonsense', '', 0.01)).toBe(false);
    });
});
