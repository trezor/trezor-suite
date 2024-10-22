/**
 * Type-guard if a value is a subset of an array.
 * Useful to narrow down a union type `value` to a subset of the union (typeof `arr`).
 *
 * Example:
 * type Variant = 'a' | 'b' | 'c' | 'd';
 * const skippedVariants = ['a', 'b'] satisfies Variant[];
 * if(isArrayMember(variant, skippedVariants)) // variant is 'a' | 'b', else 'c' | 'd'
 */
export const isArrayMember = <Value extends string, Subset extends Value>(
    value: Value,
    arr: readonly Subset[],
): value is Subset => arr.some(v => v === value);
