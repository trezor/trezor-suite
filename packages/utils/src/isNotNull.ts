/**
 * Type safe helper function mostly to filter out null items of an array
 */
export const isNotNull = <T>(item: T | null): item is T => item !== null;
