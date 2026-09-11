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
 * - **Lazy.** Nothing is built until someone reads it. An index that no screen is using costs
 *   nothing but the definition, and the last consumer leaving releases what was built.
 * - **Shared.** The index is one object, so every consumer of it reads the same build. Ten
 *   components asking for a transaction by id in the same render pass build the map once.
 * - **Stable.** A read against an unchanged source returns the very same snapshot object, so
 *   consumers can compare by reference and a re-render that changed nothing else recomputes
 *   nothing here.
 *
 * And one that makes it cheap to keep up to date: a write touches part of the source, so a rebuild
 * only visits that part. See `getParts`.
 */

/** Ids are strings so a `Map` can hold them without an identity or ordering question. */
export type EntityId = string;

/**
 * What a rebuild did to the index, for consumers that need to react to entities rather than read
 * them — maintaining something derived, or noticing arrivals.
 *
 * Computed from the parts that were rebuilt, so asking for it costs no more than the rebuild did.
 * On the first build everything counts as added.
 */
export type EntityIndexChanges<TId extends EntityId> = {
    readonly added: readonly TId[];
    readonly removed: readonly TId[];
    /** Present before and after, but a different entity object than it was. */
    readonly updated: readonly TId[];
};

export type EntityIndexSnapshot<TEntity, TId extends EntityId> = {
    /** Every id in the order the source yielded it. */
    readonly ids: readonly TId[];
    readonly byId: ReadonlyMap<TId, TEntity>;
    readonly changes: EntityIndexChanges<TId>;
};

/**
 * A slice of the source whose identity is worth comparing: if the reducer did not touch it, it is
 * the same object it was, and the index can carry its entities over untouched.
 */
export type EntityIndexPart<TPart> = readonly [key: string, part: TPart];

export type EntityIndexDefinition<TState, TSource, TPart, TEntity, TId extends EntityId> = {
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
     * Splits the source into the pieces the reducer writes to, each under a stable key.
     *
     * This is what makes a rebuild proportional to the write rather than to the store: Immer
     * leaves every piece the reducer did not touch referentially identical, so a part that is the
     * same object as last time is carried over — not walked, and its ids not recomputed. For
     * transactions the parts are the per-account arrays, so one account receiving a transaction
     * costs one account's worth of work however many accounts the user has.
     *
     * Optional. Without it the whole source is one part, which is correct but rebuilds everything
     * on every write.
     */
    getParts?: (source: TSource) => Iterable<EntityIndexPart<TPart>>;
    /**
     * Every entity in a part. Called only for parts that changed, so it is free to walk whatever
     * shape the reducer keeps.
     */
    getEntities: (part: TPart) => Iterable<TEntity>;
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
     * Keeps the index's build alive until the returned function is called. Reads work without a
     * subscription — what a subscription adds is that the build survives being unused, rather than
     * being dropped the moment the last consumer goes away.
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

const NO_CHANGES: EntityIndexChanges<never> = { added: [], removed: [], updated: [] };

const WHOLE_SOURCE_KEY = '';

/** What a part contributed last time, so an untouched part can contribute it again unchanged. */
type BuiltPart<TEntity, TId extends EntityId> = {
    part: unknown;
    entries: readonly (readonly [TId, TEntity])[];
};

export const createEntityIndex = <TState, TSource, TEntity, TId extends EntityId, TPart = TSource>({
    name,
    selectSource,
    getParts,
    getEntities,
    getId,
}: EntityIndexDefinition<TState, TSource, TPart, TEntity, TId>): EntityIndex<
    TState,
    TEntity,
    TId
> => {
    // One per index rather than one per build, so that an index which is empty across several
    // different sources still hands back the same snapshot and consumers see no change.
    const emptySnapshot: EntityIndexSnapshot<TEntity, TId> = {
        ids: [],
        byId: new Map(),
        changes: NO_CHANGES,
    };

    const toParts =
        getParts ??
        ((source: TSource) => [[WHOLE_SOURCE_KEY, source as unknown as TPart]] as const);

    let subscriberCount = 0;
    // The build, the source it was built from and the parts it was assembled from, kept together
    // so they cannot disagree. `undefined` means the next read builds from nothing.
    let cached:
        | {
              source: TSource;
              snapshot: EntityIndexSnapshot<TEntity, TId>;
              parts: ReadonlyMap<string, BuiltPart<TEntity, TId>>;
          }
        | undefined;

    const buildPart = (part: TPart): readonly (readonly [TId, TEntity])[] => {
        const entries: (readonly [TId, TEntity])[] = [];

        for (const entity of getEntities(part)) {
            entries.push([getId(entity), entity]);
        }

        return entries;
    };

    const build = (source: TSource): EntityIndexSnapshot<TEntity, TId> => {
        const previous = cached;
        const parts = new Map<string, BuiltPart<TEntity, TId>>();
        const byId = new Map<TId, TEntity>();
        const ids: TId[] = [];

        const added: TId[] = [];
        const updated: TId[] = [];
        // Only ids the rebuilt or vanished parts used to hold can have gone; everything else was
        // carried over untouched. Checked against the finished index below, because an id can move
        // between parts.
        const possiblyRemoved: TId[] = [];

        for (const [key, part] of toParts(source)) {
            const previousPart = previous?.parts.get(key);
            const isUntouched = previousPart !== undefined && previousPart.part === part;
            const entries = isUntouched ? previousPart.entries : buildPart(part);

            parts.set(key, { part, entries });

            if (!isUntouched && previousPart) {
                for (const [id] of previousPart.entries) {
                    possiblyRemoved.push(id);
                }
            }

            for (const entry of entries) {
                const [id, entity] = entry;

                // A repeated id means `getId` does not identify these entities. The last one wins,
                // the way a write to the same key would, and the id keeps its first position.
                if (!byId.has(id)) {
                    ids.push(id);
                }
                byId.set(id, entity);

                if (isUntouched) {
                    continue;
                }

                const previousEntity = previous?.snapshot.byId.get(id);
                if (previousEntity === undefined) {
                    added.push(id);
                } else if (previousEntity !== entity) {
                    updated.push(id);
                }
            }
        }

        // Parts the source no longer has at all.
        previous?.parts.forEach((previousPart, key) => {
            if (!parts.has(key)) {
                for (const [id] of previousPart.entries) {
                    possiblyRemoved.push(id);
                }
            }
        });

        const removed = possiblyRemoved.filter(id => !byId.has(id));

        // The very first build is not a change anyone can have missed, and saying so would mean
        // listing every entity in the store.
        const changes: EntityIndexChanges<TId> = previous
            ? { added, removed, updated }
            : (NO_CHANGES as EntityIndexChanges<TId>);

        cached = {
            source,
            parts,
            snapshot:
                ids.length === 0 && removed.length === 0 ? emptySnapshot : { ids, byId, changes },
        };

        return cached.snapshot;
    };

    const read = (state: TState): EntityIndexSnapshot<TEntity, TId> => {
        const source = selectSource(state);

        if (cached?.source === source) {
            return cached.snapshot;
        }

        // Built whether or not anyone is subscribed. A list of a hundred rows reads the index a
        // hundred times on its first render, before a single subscription effect has run, and
        // those have to be one build. Subscribers decide when the build is *released*, not when
        // it is made.
        return build(source);
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
