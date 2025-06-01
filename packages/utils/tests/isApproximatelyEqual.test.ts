import { BigNumber } from '../src/bigNumber';
import { isApproximatelyEqual } from '../src/isApproximatelyEqual';

describe(isApproximatelyEqual.name, () => {
    it('always returns true for equal values', () => {
        expect(isApproximatelyEqual(100, 100, 0.001)).toBe(true);
        expect(isApproximatelyEqual(100, '100', 0.001)).toBe(true);
        expect(isApproximatelyEqual('100', '100', 0.001)).toBe(true);
        expect(isApproximatelyEqual(new BigNumber(-123), '-123', 0.001)).toBe(true);
        expect(isApproximatelyEqual('-123.001', '-123.001000', 0.001)).toBe(true);
    });

    it('handles zero values correctly', () => {
        expect(isApproximatelyEqual(0, 0, 0.01)).toBe(true);
        expect(isApproximatelyEqual(0, 1, 0.01)).toBe(false);
    });

    it('handles relative tolerance', () => {
        expect(isApproximatelyEqual(100, 101, 0.005)).toBe(false);
        expect(isApproximatelyEqual(100, 101, 0.01)).toBe(true);
        expect(isApproximatelyEqual(100, 101, 0.02)).toBe(true);
    });

    it('handles NaN values', () => {
        expect(isApproximatelyEqual(100, NaN, 0.01)).toBe(false);
        expect(isApproximatelyEqual(NaN, 100, 0.01)).toBe(false);
        expect(isApproximatelyEqual(NaN, NaN, 0.01)).toBe(false);
        expect(isApproximatelyEqual('nonsense', '123', 0.01)).toBe(false);
        expect(isApproximatelyEqual('123', 'nonsense', 0.01)).toBe(false);
        expect(isApproximatelyEqual('nonsense', '', 0.01)).toBe(false);
    });
});
