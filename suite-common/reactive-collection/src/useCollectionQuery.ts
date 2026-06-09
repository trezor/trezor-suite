import { useSyncExternalStore } from 'react';

import type { Collection, Query } from './createCollection';
import { useDebouncedValue } from './useDebouncedValue';

export type UseCollectionQueryOptions<A> = {
    /**
     * Debounce changes to `arg` by this many milliseconds. The query keeps
     * tracking collection changes immediately for the currently-committed arg —
     * only the *argument* (e.g. a fast-changing search string) is debounced.
     * `0` or omitted disables debouncing. The first value is applied without
     * delay.
     */
    debounceMs?: number;
    /**
     * Maps `arg` to a stable string used to detect content changes for the
     * debounce timer. Defaults to a JSON serialization, which is correct for
     * plain primitive/object args.
     */
    getArgKey?: (arg: A) => string;
};

/**
 * Bind a memoized {@link Query} to a {@link Collection} and re-render only when
 * the query result actually changes.
 *
 * Reference stability is delegated to the query's cache: as long as neither the
 * collection version nor the (committed) argument changes, `query(arg)` returns
 * the same reference, so `useSyncExternalStore` sees no change and skips the
 * re-render — even when `arg` is a freshly-created object each render.
 *
 * Pass `options.debounceMs` to debounce argument changes (e.g. a search input)
 * while still reflecting collection updates immediately.
 */
export const useCollectionQuery = <T, A, R>(
    collection: Collection<T>,
    query: Query<A, R>,
    arg: A,
    options?: UseCollectionQueryOptions<A>,
): R => {
    const committedArg = useDebouncedValue(arg, options?.debounceMs, options?.getArgKey);

    return useSyncExternalStore(
        collection.subscribe,
        () => query(committedArg),
        () => query(committedArg),
    );
};
