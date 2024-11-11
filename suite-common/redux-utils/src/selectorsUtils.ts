import { createSelectorCreator, weakMapMemoize } from 'reselect';

const EMPTY_STABLE_ARRAY: unknown[] = [];

/**
 * Returns a stable empty array reference instead of creating a new empty array each time.
 * This helps prevent unnecessary re-renders when using empty arrays in React components.
 */
export const returnStableArrayIfEmpty = <T>(array?: readonly T[] | T[]): T[] => {
    return array && array.length > 0 ? (array as T[]) : (EMPTY_STABLE_ARRAY as T[]);
};

// For selectors with parameters, use WeakMap memoization
export const createWeakMapSelector = createSelectorCreator({
    memoize: weakMapMemoize,
    argsMemoize: weakMapMemoize,
});
