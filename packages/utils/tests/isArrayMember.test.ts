import { isArrayMember } from '../src/isArrayMember';

describe(isArrayMember.name, () => {
    it('determines if value is contained in an array', () => {
        const arr = ['a', 'b', 'c'] as const;
        expect(isArrayMember('a' as string, arr)).toBe(true);
        expect(isArrayMember('d' as any, arr)).toBe(false);
        expect(isArrayMember(undefined as any, arr)).toBe(false);
    });

    it('correctly narrows down value type (typescript only)', () => {
        type Variant = 'a' | 'b' | 'c' | 'd';
        const skippedVariants = ['a', 'b'] satisfies Variant[];
        const variant = 'a' as Variant;

        // the unit test is trivial here, but type-check verifies that the type narrowing works as supposed to
        if (isArrayMember(variant, skippedVariants)) {
            expect(variant === 'a').toBe(true);
            // @ts-expect-error TS2367: variant was narrowed down to 'a' | 'b', so it has no overlap with 'c'
            expect(variant === 'c').toBe(false);
        } else {
            expect(variant === 'c').toBe(false);
            // @ts-expect-error TS2367: variant was narrowed down to 'c' | 'd', so it has no overlap with 'a'
            expect(variant === 'a').toBe(true);
        }
    });
});
