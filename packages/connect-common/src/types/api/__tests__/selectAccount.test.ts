import { Validate } from '@trezor/schema-utils';

import { MultiSelectBounds } from '../selectAccount';

describe('MultiSelectBounds schema', () => {
    it('accepts valid whole-number bounds and one-sided/empty bounds', () => {
        expect(Validate(MultiSelectBounds, { minCount: 2, maxCount: 5 })).toBe(true);
        expect(Validate(MultiSelectBounds, { minCount: 3, maxCount: 3 })).toBe(true);
        expect(Validate(MultiSelectBounds, { minCount: 2 })).toBe(true);
        expect(Validate(MultiSelectBounds, { maxCount: 5 })).toBe(true);
        expect(Validate(MultiSelectBounds, {})).toBe(true);
    });

    it('rejects fractional bounds (whole numbers only)', () => {
        expect(Validate(MultiSelectBounds, { minCount: 2.5 })).toBe(false);
        expect(Validate(MultiSelectBounds, { minCount: 2, maxCount: 4.5 })).toBe(false);
    });

    it('rejects bounds below 1', () => {
        expect(Validate(MultiSelectBounds, { minCount: 0 })).toBe(false);
    });

    it('cannot express the cross-field constraint, so inverted bounds pass the schema alone', () => {
        expect(Validate(MultiSelectBounds, { minCount: 5, maxCount: 2 })).toBe(true);
    });
});
