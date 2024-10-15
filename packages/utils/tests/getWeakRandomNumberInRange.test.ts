import { getWeakRandomNumberInRange } from '../src';

describe(getWeakRandomNumberInRange.name, () => {
    it('returns value in range', () => {
        for (let i = 0; i < 10_000; i++) {
            const result = getWeakRandomNumberInRange(0, 100);
            expect(result).toBeGreaterThanOrEqual(0);
            expect(result).toBeLessThanOrEqual(100);
        }
    });
});
