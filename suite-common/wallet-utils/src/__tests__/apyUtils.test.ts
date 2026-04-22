import { getApyPercent } from '../apyUtils';

describe(getApyPercent.name, () => {
    it('converts APY rate to percent with two decimal places', () => {
        expect(getApyPercent(0.041070907542037835)).toBe(4.11);
    });

    it('returns null for invalid APY rate', () => {
        expect(getApyPercent(Number.NaN)).toBeNull();
        expect(getApyPercent(Number.POSITIVE_INFINITY)).toBeNull();
    });
});
