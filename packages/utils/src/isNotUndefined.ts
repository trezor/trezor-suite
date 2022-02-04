/**
 * Type safe helper function mostly to filter out undefined items of an array
 */
export const isNotUndefined = <T>(item?: T): item is T => typeof item !== 'undefined';
