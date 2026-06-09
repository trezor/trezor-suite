import type { Collection, Query } from './createCollection';

export type SubscribeToQueryOptions = {
    /** Invoke the callback once with the current result immediately on subscribe. */
    emitInitial?: boolean;
};

/**
 * Query-level subscription for non-React consumers: invokes `onChange` only when
 * `query(arg)`'s result actually changes — collection changes that don't affect
 * this query are ignored.
 *
 * This is the same filtering `useCollectionQuery` relies on, made available
 * outside React: the underlying `collection.subscribe` fires on every change,
 * but because the query returns a stable reference when its result is unchanged,
 * a reference comparison is enough to drop the irrelevant notifications.
 *
 * Returns an unsubscribe function.
 */
export const subscribeToQuery = <T, A, R>(
    collection: Collection<T>,
    query: Query<A, R>,
    arg: A,
    onChange: (result: R) => void,
    options?: SubscribeToQueryOptions,
): (() => void) => {
    let last = query(arg);

    if (options?.emitInitial) onChange(last);

    return collection.subscribe(() => {
        const next = query(arg);
        if (!Object.is(next, last)) {
            last = next;
            onChange(next);
        }
    });
};
