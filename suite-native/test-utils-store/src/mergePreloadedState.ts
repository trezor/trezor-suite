import { mergeDeepObject } from '@trezor/utils';

import { type PreloadedStatePartial } from './createLightStore';

/**
 * Deep-merges a `PreloadedStatePartial<T>` into a fully-typed `T` base, returning `T`.
 * Arrays are replaced (not concatenated). Wraps `mergeDeepObject.withOptions` so the
 * merged return type narrows back to `T` instead of the loose `TMerged<T[number]>`
 * that the underlying utility produces.
 */
export const mergePreloadedState = <T extends Record<string, unknown>>(
    base: T,
    overrides: PreloadedStatePartial<NoInfer<T>>,
): T => mergeDeepObject.withOptions({ mergeArrays: false }, base, overrides) as T;
