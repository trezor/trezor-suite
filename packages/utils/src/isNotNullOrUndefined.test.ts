import { isNotNullOrUndefined } from './isNotNullOrUndefined';

describe(isNotNullOrUndefined.name, () => {
    it('returns false for null', () => {
        expect(isNotNullOrUndefined(null)).toBe(false);
    });

    it('returns false for undefined', () => {
        expect(isNotNullOrUndefined(undefined)).toBe(false);
    });

    it('returns true for non-nullish values', () => {
        expect(isNotNullOrUndefined(0)).toBe(true);
        expect(isNotNullOrUndefined('')).toBe(true);
        expect(isNotNullOrUndefined(false)).toBe(true);
        expect(isNotNullOrUndefined([])).toBe(true);
        expect(isNotNullOrUndefined({})).toBe(true);
    });

    it('filters null and undefined items from an array', () => {
        const items: (string | null | undefined)[] = ['a', null, 'b', undefined, 'c'];
        const filtered = items.filter(isNotNullOrUndefined);
        expect(filtered).toEqual(['a', 'b', 'c']);
    });

    it('correctly narrows down the type (typescript only)', () => {
        const item: string | null | undefined = 'hello';

        if (isNotNullOrUndefined(item)) {
            const result: string = item;
            expect(result).toBe('hello');
        } else {
            expect(item === 'hello').toBe(false);
        }
    });
});
