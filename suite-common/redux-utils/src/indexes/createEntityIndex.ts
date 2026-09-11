/**
 * A lookup table over entities that live in the store, built from the store rather than kept
 * beside it.
 *
 * Reducers hold entities the shape the reducer needs — transactions, for instance, are an array
 * per account — so every lookup that does not match that shape is a scan. An index turns those
 * scans into map reads without any reducer having to maintain a second copy of the data that
 * could drift from the first.
 *
 * Three properties make it usable from React:
 *
 * - **Lazy.** Nothing is built until someone reads it, and nothing is retained until someone
 *   subscribes. An index that no screen is using costs nothing but the definition.
 * - **Shared.** The index is one object, so every consumer of it reads the same build. Ten
 *   components asking for a transaction by id in the same render pass build the map once.
 * - **Stable.** A read against an unchanged source returns the very same snapshot object, so
 *   consumers can compare by reference and a re-render that changed nothing else recomputes
 *   nothing here.
 */

/** Ids are strings so a `Map` can hold them without an identity or ordering question. */
export type EntityId = string;

export type EntityIndexSnapshot<TEntity, TId extends EntityId> = {
    /** Every id in the order the source yielded it. */
    readonly ids: readonly TId[];
    readonly byId: ReadonlyMap<TId, TEntity>;
};

export type EntityIndexDefinition<TState, TSource, TEntity, TId extends EntityId> = {
    /** Used in errors and in dev tooling. Not an identity — the object itself is the instance. */
    name: string;
    /**
     * The one value whose identity answers "has anything changed?".
     *
     * It has to be the object the reducer replaces on every write and keeps otherwise — with
     * Immer, the slice or a branch of it. Reading it must be cheap, because it happens on every
     * read; it is compared, never walked.
     */
    selectSource: (state: TState) => TSource;
    /**
     * Every entity currently in the source. Called only when the source changed, so it is free to
     * walk whatever shape the reducer keeps.
     */
    getEntities: (source: TSource) => Iterable<TEntity>;
    /**
     * The entity's primary key. Mandatory: an index with no identity for its entities cannot
     * answer the only question every index has to answer.
     *
     * It has to be derivable from the entity alone, so that a caller holding an entity can find
     * its place in the index without knowing where the reducer keeps it.
     */
    getId: (entity: TEntity) => TId;
};

export type EntityIndex<TState, TEntity, TId extends EntityId> = {
    readonly name: string;
    /**
     * Keeps the index's build alive until the returned function is called. Reads work without it —
     * they just build every time, which is the honest cost of reading something nobody is holding.
     *
     * @returns unsubscribe
     */
    subscribe: () => () => void;
    /** How many subscribers are holding the build. Exposed for tests and dev tooling. */
    getSubscriberCount: () => number;
    /** The index as of this state. Same object for as long as the source is unchanged. */
    read: (state: TState) => EntityIndexSnapshot<TEntity, TId>;
    selectById: (state: TState, id: TId) => TEntity | undefined;
    selectIds: (state: TState) => readonly TId[];
};

export const createEntityIndex = <TState, TSource, TEntity, TId extends EntityId>({
    name,
    selectSource,
    getEntities,
    getId,
}: EntityIndexDefinition<TState, TSource, TEntity, TId>): EntityIndex<TState, TEntity, TId> => {
    // One per index rather than one per build, so that an index which is empty across several
    // different sources still hands back the same snapshot and consumers see no change.
    const emptySnapshot: EntityIndexSnapshot<TEntity, TId> = { ids: [], byId: new Map() };
    let subscriberCount = 0;
    // The build and the source it was built from, kept together so they cannot disagree. Held only
    // while someone is subscribed; `undefined` means the next read builds.
    let cached: { source: TSource; snapshot: EntityIndexSnapshot<TEntity, TId> } | undefined;

    const build = (source: TSource): EntityIndexSnapshot<TEntity, TId> => {
        const byId = new Map<TId, TEntity>();
        const ids: TId[] = [];

        for (const entity of getEntities(source)) {
            const id = getId(entity);
            // A repeated id means `getId` does not identify these entities. The last one wins, the
            // way a write to the same key would, and the id keeps its first position.
            if (!byId.has(id)) {
                ids.push(id);
            }
            byId.set(id, entity);
        }

        if (ids.length === 0) {
            return emptySnapshot;
        }

        return { ids, byId };
    };

    const read = (state: TState): EntityIndexSnapshot<TEntity, TId> => {
        const source = selectSource(state);

        if (cached?.source === source) {
            return cached.snapshot;
        }

        const snapshot = build(source);

        // Nobody is holding this index, so the build is this caller's alone: hand it over without
        // keeping it, rather than retaining entities for a reader that may never come back.
        if (subscriberCount > 0) {
            cached = { source, snapshot };
        }

        return snapshot;
    };

    return {
        name,

        subscribe: () => {
            subscriberCount += 1;
            let isSubscribed = true;

            return () => {
                // Guard against a consumer unsubscribing twice, which would release the build
                // while someone else is still holding it.
                if (!isSubscribed) {
                    return;
                }
                isSubscribed = false;
                subscriberCount -= 1;

                if (subscriberCount === 0) {
                    cached = undefined;
                }
            };
        },

        getSubscriberCount: () => subscriberCount,

        read,

        selectById: (state, id) => read(state).byId.get(id),

        selectIds: state => read(state).ids,
    };
};
