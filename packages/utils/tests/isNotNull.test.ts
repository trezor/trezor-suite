import { isNotNull } from '../src/isNotNull';

describe(isNotNull.name, () => {
    it('returns false for null', () => {
        expect(isNotNull(null)).toBe(false);
    });

    it('returns true for undefined', () => {
        expect(isNotNull(undefined)).toBe(true);
    });

    it('returns true for non-null values', () => {
        expect(isNotNull(0)).toBe(true);
        expect(isNotNull('')).toBe(true);
        expect(isNotNull(false)).toBe(true);
        expect(isNotNull([])).toBe(true);
        expect(isNotNull({})).toBe(true);
    });

    it('filters null items from an array', () => {
        const items: (string | null)[] = ['a', null, 'b', null, 'c'];
        const filtered = items.filter(isNotNull);
        expect(filtered).toEqual(['a', 'b', 'c']);
    });

    it('correctly narrows down the type', () => {
        const item: string | null = 'hello';

        if (isNotNull(item)) {
            const result: string = item;
            expect(result).toBe('hello');
        } else {
            expect(item === 'hello').toBe(false);
        }
    });
});
