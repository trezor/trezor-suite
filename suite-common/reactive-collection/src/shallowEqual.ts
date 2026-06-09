/**
 * Shallow equality check. Two values are shallow-equal when they are the same
 * reference, or both are objects with the same set of keys whose values are
 * each `Object.is`-equal.
 *
 * Used both for deciding whether an entity actually changed when it is added to
 * a `Collection` (so re-created-but-identical objects don't invalidate caches)
 * and as the default equality for query arguments.
 */
export const shallowEqual = (a: unknown, b: unknown): boolean => {
    if (Object.is(a, b)) return true;

    if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
        return false;
    }

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
        if (
            !Object.prototype.hasOwnProperty.call(b, key) ||
            !Object.is((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
        ) {
            return false;
        }
    }

    return true;
};
