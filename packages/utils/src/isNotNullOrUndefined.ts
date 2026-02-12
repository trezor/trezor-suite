import { isNotNull } from './isNotNull';
import { isNotUndefined } from './isNotUndefined';

/**
 * Type safe helper function mostly to filter out null and undefined items of an array
 */
export const isNotNullOrUndefined = <T>(item: T | null | undefined): item is T =>
    isNotNull(item) && isNotUndefined(item);
