import { shallowEqual } from './shallowEqual';

export type CollectionId = string | number;

type Listener = () => void;

export type Query<A, R> = (arg: A) => R;

export type CollectionOptions<T> = {
    /** Derives the stable identity of an entity. Adds are keyed by this id. */
    getId: (item: T) => CollectionId;
    /**
     * Decides whether an entity actually changed when re-added under the same id.
     * Defaults to {@link shallowEqual}, so passing a new object with identical
     * fields is a no-op and does not invalidate query caches.
     */
    equals?: (a: T, b: T) => boolean;
};

export type DefineQueryOptions<A, R> = {
    /** Equality used to match a query argument against cached ones. Default {@link shallowEqual}. */
    argEquals?: (a: A, b: A) => boolean;
    /**
     * Equality used to decide whether a recomputed result is unchanged. When it
     * is, the previous reference is returned so consumers (and
     * `useSyncExternalStore`) don't see a change. Default {@link shallowEqual},
     * which treats two arrays/objects with the same members as equal.
     */
    resultEquals?: (a: R, b: R) => boolean;
    /** How many recent (arg, result) pairs to keep. Default 8. */
    cacheSize?: number;
};

export type DefineFilterQueryOptions<A> = {
    /** Equality used to match a query argument against cached ones. Default {@link shallowEqual}. */
    argEquals?: (a: A, b: A) => boolean;
    /** How many recent args to keep incremental state for. Default 8. */
    cacheSize?: number;
};

export type Collection<T> = {
    /** Insert or update a single entity by its id. No-op if the value is unchanged. */
    add: (item: T) => Collection<T>;
    /** Insert or update many entities. Emits at most one change notification. */
    addAll: (items: readonly T[]) => Collection<T>;
    /**
     * Replace the whole collection with `items`, reconciling by id: unchanged
     * entities keep their reference, changed ones are updated, and ids absent
     * from `items` are removed. Emits at most one change notification, and only
     * if something actually changed.
     */
    setAll: (items: readonly T[]) => Collection<T>;
    /** Remove an entity by id. No-op if absent. */
    remove: (id: CollectionId) => Collection<T>;
    /** Remove every entity. */
    clear: () => Collection<T>;
    has: (id: CollectionId) => boolean;
    get: (id: CollectionId) => T | undefined;
    /** Snapshot array of all entities. Stable reference until the next real change. */
    getAll: () => readonly T[];
    readonly size: number;
    /** Monotonic counter bumped only on real changes — cheap O(1) "did anything change?". */
    getVersion: () => number;
    /** Subscribe to changes. Returns an unsubscribe function. */
    subscribe: (listener: Listener) => () => void;
    /**
     * Build a memoized query.
     *
     * - Same `(version, arg)` -> cached result returned without recomputing.
     * - New version, same `arg` -> recomputes, but reuses the previous reference
     *   when the result is `resultEquals` to it.
     *
     * The second rule is what keeps `useSyncExternalStore` from re-rendering on
     * collection changes that don't affect this query's result.
     */
    defineQuery: <A, R>(
        fn: (items: readonly T[], arg: A) => R,
        options?: DefineQueryOptions<A, R>,
    ) => Query<A, R>;
    /**
     * Build an incremental filter query. Like a `defineQuery` whose `fn` is
     * `items.filter(predicate)`, but the predicate is only re-evaluated for
     * entities whose reference changed since the previous run (for the same
     * arg). On a `setAll` that touches one entity, only that entity is re-tested
     * — every other entity reuses its previous match decision. The result array
     * keeps its reference when membership is unchanged.
     */
    defineFilterQuery: <A>(
        predicate: (item: T, arg: A) => boolean,
        options?: DefineFilterQueryOptions<A>,
    ) => Query<A, readonly T[]>;
};

export const createCollection = <T>(options: CollectionOptions<T>): Collection<T> => {
    const { getId, equals = shallowEqual } = options;

    let items = new Map<CollectionId, T>();
    const listeners = new Set<Listener>();
    let version = 0;

    let snapshotVersion = -1;
    let snapshot: readonly T[] = [];

    const notify = () => {
        version += 1;
        listeners.forEach(listener => listener());
    };

    const setItem = (item: T): boolean => {
        const id = getId(item);
        const existing = items.get(id);
        // Keep the existing reference when nothing meaningfully changed, so
        // downstream identity checks stay stable.
        if (existing !== undefined && equals(existing, item)) return false;
        items.set(id, item);

        return true;
    };

    const getAll = (): readonly T[] => {
        if (snapshotVersion !== version) {
            snapshot = Array.from(items.values());
            snapshotVersion = version;
        }

        return snapshot;
    };

    const collection: Collection<T> = {
        add: item => {
            if (setItem(item)) notify();

            return collection;
        },
        addAll: newItems => {
            let changed = false;
            for (const item of newItems) {
                if (setItem(item)) changed = true;
            }
            if (changed) notify();

            return collection;
        },
        setAll: nextItems => {
            const next = new Map<CollectionId, T>();
            let changed = false;

            for (const item of nextItems) {
                const id = getId(item);
                const existing = items.get(id);
                // Keep the existing reference when the value is unchanged, so
                // incremental queries can skip it; otherwise adopt the new one.
                if (existing !== undefined && equals(existing, item)) {
                    next.set(id, existing);
                } else {
                    next.set(id, item);
                    changed = true;
                }
            }

            // A smaller set means something was removed.
            if (next.size !== items.size) changed = true;

            // Same members and values, but a different order is still a change —
            // the canonical iteration order (used by getAll and filters) moved.
            if (!changed) {
                const prevKeys = items.keys();
                for (const key of next.keys()) {
                    if (prevKeys.next().value !== key) {
                        changed = true;
                        break;
                    }
                }
            }

            items = next;
            if (changed) notify();

            return collection;
        },
        remove: id => {
            if (items.delete(id)) notify();

            return collection;
        },
        clear: () => {
            if (items.size > 0) {
                items.clear();
                notify();
            }

            return collection;
        },
        has: id => items.has(id),
        get: id => items.get(id),
        getAll,
        get size() {
            return items.size;
        },
        getVersion: () => version,
        subscribe: listener => {
            listeners.add(listener);

            return () => {
                listeners.delete(listener);
            };
        },
        defineQuery: <A, R>(
            fn: (items: readonly T[], arg: A) => R,
            queryOptions?: DefineQueryOptions<A, R>,
        ): Query<A, R> => {
            const {
                argEquals = shallowEqual,
                resultEquals = shallowEqual,
                cacheSize = 8,
            } = queryOptions ?? {};

            type Entry = { arg: A; result: R; version: number };
            const cache: Entry[] = [];

            const promote = (entry: Entry) => {
                const index = cache.indexOf(entry);
                if (index > 0) {
                    cache.splice(index, 1);
                    cache.unshift(entry);
                }
            };

            return (arg: A): R => {
                const entry = cache.find(e => argEquals(e.arg, arg));

                if (entry) {
                    if (entry.version === version) {
                        promote(entry);

                        return entry.result;
                    }
                    // Stale: recompute, but keep the old reference if unchanged
                    // so downstream consumers don't see a spurious change.
                    const next = fn(getAll(), arg);
                    entry.result = resultEquals(entry.result, next) ? entry.result : next;
                    entry.version = version;
                    promote(entry);

                    return entry.result;
                }

                const result = fn(getAll(), arg);
                cache.unshift({ arg, result, version });
                if (cache.length > cacheSize) cache.pop();

                return result;
            };
        },
        defineFilterQuery: <A>(
            predicate: (item: T, arg: A) => boolean,
            filterOptions?: DefineFilterQueryOptions<A>,
        ): Query<A, readonly T[]> => {
            const { argEquals = shallowEqual, cacheSize = 8 } = filterOptions ?? {};

            type Match = { item: T; matched: boolean };
            type Entry = {
                arg: A;
                version: number;
                seen: Map<CollectionId, Match>;
                result: readonly T[];
            };
            const cache: Entry[] = [];

            const promote = (entry: Entry) => {
                const index = cache.indexOf(entry);
                if (index > 0) {
                    cache.splice(index, 1);
                    cache.unshift(entry);
                }
            };

            const compute = (entry: Entry | undefined, arg: A) => {
                const prevResult = entry?.result ?? [];
                const seen = new Map<CollectionId, Match>();
                const nextResult: T[] = [];
                // New entry -> there is no previous result to reuse.
                let membershipChanged = entry === undefined;
                let prevIndex = 0;

                for (const item of items.values()) {
                    const id = getId(item);
                    const prev = entry?.seen.get(id);
                    // Same reference -> entity didn't change, reuse its decision
                    // and skip the (potentially expensive) predicate.
                    const matched = prev?.item === item ? prev.matched : predicate(item, arg);
                    seen.set(id, { item, matched });

                    if (matched) {
                        if (prevResult[prevIndex] !== item) membershipChanged = true;
                        prevIndex += 1;
                        nextResult.push(item);
                    }
                }
                if (prevIndex !== prevResult.length) membershipChanged = true;

                return { seen, result: membershipChanged ? nextResult : prevResult };
            };

            return (arg: A): readonly T[] => {
                const entry = cache.find(e => argEquals(e.arg, arg));

                if (entry?.version === version) {
                    promote(entry);

                    return entry.result;
                }

                const { seen, result } = compute(entry, arg);

                if (entry) {
                    entry.seen = seen;
                    entry.result = result;
                    entry.version = version;
                    promote(entry);

                    return entry.result;
                }

                cache.unshift({ arg, version, seen, result });
                if (cache.length > cacheSize) cache.pop();

                return result;
            };
        },
    };

    return collection;
};
