import { isNotNull } from './isNotNull';
import { isNotUndefined } from './isNotUndefined';

export const isNotNullOrUndefined = <T>(item: T | null | undefined): item is T =>
    isNotNull(item) && isNotUndefined(item);
