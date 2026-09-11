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

/** Ids and keys are strings so a `Map` can hold them without an identity or ordering question. */
export type EntityId = string;

/**
 * What a rebuild did to the index, for consumers that need to react to entities rather than read
 * them — maintaining something derived, or noticing arrivals.
 *
 * Computed from the parts that were rebuilt, so asking for it costs no more than the rebuild did.
 */
export type EntityIndexChanges<TId extends EntityId> = {
    readonly added: readonly TId[];
    readonly removed: readonly TId[];
    /** Present before and after, but a different entity object than it was. */
    readonly updated: readonly TId[];
};

/**
 * Picks which group an entity belongs in, for a lookup other than by primary key.
 *
 * Return nothing to leave the entity out of this index — a "pending transactions" index is a
 * grouping that most transactions have no key for. Return several keys to put it in several
 * groups, the way a transaction belongs to each of its target addresses.
 */
export type EntityGroupKeySelector<TEntity, TKey extends EntityId = EntityId> = (
    entity: TEntity,
) => TKey | readonly TKey[] | undefined;

export type EntityGroupKeySelectors<TEntity> = Record<string, EntityGroupKeySelector<TEntity>>;

/** The key type a group selector groups by, with the "several" and "none" cases unwrapped. */
export type EntityGroupKey<TSelector> =
    TSelector extends EntityGroupKeySelector<never, infer TKey> ? TKey : never;

/**
 * What a group holds under one key: the ids for a list that wants each row to watch its own
 * entity, and the entities for everything else.
 *
 * Both arrays are the same objects they were while the group's members are unchanged, so either
 * can go straight into a `useSelector` or a memoized child.
 */
export type EntityGroup<TEntity, TId extends EntityId> = {
    readonly ids: readonly TId[];
    readonly entities: readonly TEntity[];
};

export type EntityIndexSnapshot<
    TEntity,
    TId extends EntityId,
    TGroups extends EntityGroupKeySelectors<TEntity>,
> = {
    /** Every id in the order the source yielded it. */
    readonly ids: readonly TId[];
    readonly byId: ReadonlyMap<TId, TEntity>;
    /** What each group holds, by group name and then by key. */
    readonly groups: {
        readonly [TName in keyof TGroups]: ReadonlyMap<
            EntityGroupKey<TGroups[TName]>,
            EntityGroup<TEntity, TId>
        >;
    };
    readonly changes: EntityIndexChanges<TId>;
};

/**
 * A slice of the source whose identity is worth comparing: if the reducer did not touch it, it is
 * the same object it was, and the index can carry its entities over untouched.
 */
export type EntityIndexPart<TPart> = readonly [key: string, part: TPart];

export type EntityIndexDefinition<
    TState,
    TSource,
    TPart,
    TEntity,
    TId extends EntityId,
    TGroups extends EntityGroupKeySelectors<TEntity>,
> = {
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
     * same object as last time is carried over — not walked, and neither its ids nor its group
     * keys recomputed. For transactions the parts are the per-account arrays, so one account
     * receiving a transaction costs one account's worth of work however many accounts the user has.
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
    /**
     * Lookups by something other than the primary key, each named. Optional: an index is useful
     * with none of them, and each one costs a pass over the entities of the parts that changed.
     */
    groupBy?: TGroups;
};

export type EntityIndexListener<
    TEntity,
    TId extends EntityId,
    TGroups extends EntityGroupKeySelectors<TEntity>,
> = (snapshot: EntityIndexSnapshot<TEntity, TId, TGroups>) => void;

export type EntityIndex<
    TState,
    TEntity,
    TId extends EntityId,
    TGroups extends EntityGroupKeySelectors<TEntity> = Record<string, never>,
> = {
    readonly name: string;
    /**
     * Keeps the index's build alive until the returned function is called, without asking to be
     * told anything. For a consumer that reads the index itself — through `useSelector`, or a
     * thunk — and only wants its work not thrown away between reads.
     *
     * Retaining builds nothing on its own: the index stays lazy until something reads it.
     *
     * @returns release
     */
    retain: () => () => void;
    /**
     * Calls `listener` with the new snapshot whenever a read finds the index changed, so a
     * consumer can react to entities without reading them itself — `snapshot.changes` says what
     * happened.
     *
     * A read is what discovers the change, because that is the only moment the index looks at the
     * source. In an app that means any component or selector reading this index drives everyone
     * subscribed to it; an index nothing reads notifies nothing, which is the same laziness the
     * rest of this has.
     *
     * Listeners are called from inside that read, so they must not dispatch synchronously — the
     * read may be happening in the middle of React deciding what to render. Defer if you need to.
     *
     * @returns unsubscribe
     */
    subscribe: (listener: EntityIndexListener<TEntity, TId, TGroups>) => () => void;
    /** How many consumers are holding the build. Exposed for tests and dev tooling. */
    getSubscriberCount: () => number;
    /** The index as of this state. Same object for as long as the source is unchanged. */
    read: (state: TState) => EntityIndexSnapshot<TEntity, TId, TGroups>;
    getById: (state: TState, id: TId) => TEntity | undefined;
    getIds: (state: TState) => readonly TId[];
    /**
     * The entities in one group, in source order. Empty when the group holds nothing for that key.
     *
     * The array is stable while its members are unchanged, so a consumer watching one group is
     * not woken by writes to another. This is what most callers want; `getIdsBy` is for a list
     * that would rather each row watched its own entity.
     */
    getBy: <TName extends keyof TGroups>(
        state: TState,
        groupName: TName,
        key: EntityGroupKey<TGroups[TName]>,
    ) => readonly TEntity[];
    /** The same group as `getBy`, as ids. Stable on the same terms. */
    getIdsBy: <TName extends keyof TGroups>(
        state: TState,
        groupName: TName,
        key: EntityGroupKey<TGroups[TName]>,
    ) => readonly TId[];
};

const NO_CHANGES: EntityIndexChanges<never> = { added: [], removed: [], updated: [] };

/** Shared so that "this group holds nothing" is the same array every time, and re-renders nothing. */
export const EMPTY_ENTITY_IDS: readonly never[] = [];

/** The same, for a group with no entities under a key. */
export const EMPTY_ENTITIES: readonly never[] = [];

const WHOLE_SOURCE_KEY = '';

/**
 * What a part contributed last time, so an untouched part can contribute it again without being
 * walked: its entities under their ids, and the group keys each of them was filed under.
 */
type BuiltPart<TEntity, TId extends EntityId> = {
    part: unknown;
    entries: readonly (readonly [TId, TEntity])[];
    /** Per group name, the keys of each entry — aligned with `entries` by position. */
    groupKeys: Record<string, readonly (readonly EntityId[])[]>;
};

const toKeyList = (keys: EntityId | readonly EntityId[] | undefined): readonly EntityId[] => {
    if (keys === undefined) {
        return EMPTY_ENTITY_IDS;
    }

    return Array.isArray(keys) ? keys : [keys as EntityId];
};

const areSame = <TItem>(left: readonly TItem[], right: readonly TItem[]) =>
    left.length === right.length && left.every((item, index) => item === right[index]);

export const createEntityIndex = <
    TState,
    TSource,
    TEntity,
    TId extends EntityId,
    TGroups extends EntityGroupKeySelectors<TEntity> = Record<string, never>,
    TPart = TSource,
>({
    name,
    selectSource,
    getParts,
    getEntities,
    getId,
    groupBy,
}: EntityIndexDefinition<TState, TSource, TPart, TEntity, TId, TGroups>): EntityIndex<
    TState,
    TEntity,
    TId,
    TGroups
> => {
    const groupNames = Object.keys(groupBy ?? {});

    const emptyGroups = () =>
        Object.fromEntries(
            groupNames.map(groupName => [groupName, new Map()]),
        ) as unknown as EntityIndexSnapshot<TEntity, TId, TGroups>['groups'];

    // One per index rather than one per build, so that an index which is empty across several
    // different sources still hands back the same snapshot and consumers see no change.
    const emptySnapshot: EntityIndexSnapshot<TEntity, TId, TGroups> = {
        ids: [],
        byId: new Map(),
        groups: emptyGroups(),
        changes: NO_CHANGES,
    };

    const toParts =
        getParts ??
        ((source: TSource) => [[WHOLE_SOURCE_KEY, source as unknown as TPart]] as const);

    let holderCount = 0;
    const listeners = new Set<EntityIndexListener<TEntity, TId, TGroups>>();
    let notifiedSnapshot: EntityIndexSnapshot<TEntity, TId, TGroups> | undefined;
    // The build, the source it was built from and the parts it was assembled from, kept together
    // so they cannot disagree. `undefined` means the next read builds from nothing.
    let cached:
        | {
              source: TSource;
              snapshot: EntityIndexSnapshot<TEntity, TId, TGroups>;
              parts: ReadonlyMap<string, BuiltPart<TEntity, TId>>;
          }
        | undefined;

    const buildPart = (part: TPart): BuiltPart<TEntity, TId> => {
        const entries: (readonly [TId, TEntity])[] = [];
        const groupKeys: Record<string, (readonly EntityId[])[]> = Object.fromEntries(
            groupNames.map(groupName => [groupName, []]),
        );

        for (const entity of getEntities(part)) {
            entries.push([getId(entity), entity]);

            for (const groupName of groupNames) {
                groupKeys[groupName]?.push(toKeyList(groupBy?.[groupName]?.(entity)));
            }
        }

        return { part, entries, groupKeys };
    };

    /**
     * Reuses the previous array for every group whose members are unchanged, so that a consumer
     * watching one group is not re-rendered by a write to another. The comparison is by identity
     * over ids the rebuild has already produced, which is cheaper than what the consumer would
     * otherwise do on every write.
     */
    const settleGroups = (
        built: Map<string, Map<EntityId, EntityGroup<TEntity, TId>>>,
    ): EntityIndexSnapshot<TEntity, TId, TGroups>['groups'] =>
        Object.fromEntries(
            groupNames.map(groupName => {
                const previousGroup = cached?.snapshot.groups[groupName] as
                    ReadonlyMap<EntityId, EntityGroup<TEntity, TId>> | undefined;
                const nextGroup = new Map<EntityId, EntityGroup<TEntity, TId>>();
                let isUnchanged = previousGroup?.size === built.get(groupName)?.size;

                built.get(groupName)?.forEach((group, key) => {
                    const previousEntities = previousGroup?.get(key);

                    // The entities decide it: same entities means same ids, since an id is derived
                    // from its entity. Keeping the previous group whole is what lets a consumer
                    // watching it compare by reference.
                    if (previousEntities && areSame(previousEntities.entities, group.entities)) {
                        nextGroup.set(key, previousEntities);
                    } else {
                        nextGroup.set(key, group);
                        isUnchanged = false;
                    }
                });

                return [groupName, isUnchanged && previousGroup ? previousGroup : nextGroup];
            }),
        ) as unknown as EntityIndexSnapshot<TEntity, TId, TGroups>['groups'];

    const build = (source: TSource): EntityIndexSnapshot<TEntity, TId, TGroups> => {
        const previous = cached;
        const parts = new Map<string, BuiltPart<TEntity, TId>>();
        const byId = new Map<TId, TEntity>();
        const ids: TId[] = [];
        const builtGroups = new Map<string, Map<EntityId, { ids: TId[]; entities: TEntity[] }>>(
            groupNames.map(groupName => [groupName, new Map()]),
        );

        const added: TId[] = [];
        const updated: TId[] = [];
        // Only ids the rebuilt or vanished parts used to hold can have gone; everything else was
        // carried over untouched. Checked against the finished index below, because an id can move
        // between parts.
        const possiblyRemoved: TId[] = [];

        for (const [partKey, part] of toParts(source)) {
            const previousPart = previous?.parts.get(partKey);
            const isUntouched = previousPart !== undefined && previousPart.part === part;
            const builtPart = isUntouched ? previousPart : buildPart(part);

            parts.set(partKey, builtPart);

            if (!isUntouched && previousPart) {
                for (const [id] of previousPart.entries) {
                    possiblyRemoved.push(id);
                }
            }

            builtPart.entries.forEach(([id, entity], position) => {
                // A repeated id means `getId` does not identify these entities. The last one wins,
                // the way a write to the same key would, and the id keeps its first position.
                if (!byId.has(id)) {
                    ids.push(id);
                }
                byId.set(id, entity);

                for (const groupName of groupNames) {
                    const group = builtGroups.get(groupName);

                    for (const key of builtPart.groupKeys[groupName]?.[position] ??
                        EMPTY_ENTITY_IDS) {
                        const members = group?.get(key);

                        if (!members) {
                            group?.set(key, { ids: [id], entities: [entity] });
                            continue;
                        }

                        // An entity that names the same key twice — a transaction paying an
                        // address from an input and to a target, say — belongs to the group once.
                        // Its keys are handled together, so a repeat is always the last one in.
                        if (members.ids[members.ids.length - 1] === id) {
                            continue;
                        }

                        members.ids.push(id);
                        members.entities.push(entity);
                    }
                }

                if (isUntouched) {
                    return;
                }

                const previousEntity = previous?.snapshot.byId.get(id);
                if (previousEntity === undefined) {
                    added.push(id);
                } else if (previousEntity !== entity) {
                    updated.push(id);
                }
            });
        }

        // Parts the source no longer has at all.
        previous?.parts.forEach((previousPart, partKey) => {
            if (!parts.has(partKey)) {
                for (const [id] of previousPart.entries) {
                    possiblyRemoved.push(id);
                }
            }
        });

        const removed = possiblyRemoved.filter(id => !byId.has(id));
        const groups = settleGroups(builtGroups);

        // The very first build is not a change anyone can have missed, and saying so would mean
        // listing every entity in the store.
        const changes: EntityIndexChanges<TId> = previous
            ? { added, removed, updated }
            : (NO_CHANGES as EntityIndexChanges<TId>);

        cached = {
            source,
            parts,
            snapshot:
                ids.length === 0 && removed.length === 0
                    ? emptySnapshot
                    : { ids, byId, groups, changes },
        };

        return cached.snapshot;
    };

    const notify = (snapshot: EntityIndexSnapshot<TEntity, TId, TGroups>) => {
        if (listeners.size === 0 || snapshot === notifiedSnapshot) {
            return;
        }
        notifiedSnapshot = snapshot;

        listeners.forEach(listener => {
            // One listener failing must not break the read for the consumer that made it, nor for
            // the other listeners.
            try {
                listener(snapshot);
            } catch (error) {
                console.error(`entity index "${name}" listener failed`, error);
            }
        });
    };

    const read = (state: TState): EntityIndexSnapshot<TEntity, TId, TGroups> => {
        const source = selectSource(state);

        if (cached?.source === source) {
            return cached.snapshot;
        }

        // Built whether or not anyone is holding it. A list of a hundred rows reads the index a
        // hundred times on its first render, before a single effect has run, and those have to be
        // one build. Holders decide when the build is *released*, not when it is made.
        const snapshot = build(source);
        notify(snapshot);

        return snapshot;
    };

    const retain = () => {
        holderCount += 1;
        let isHeld = true;

        return () => {
            // Guard against a consumer releasing twice, which would throw away the build while
            // someone else is still holding it.
            if (!isHeld) {
                return;
            }
            isHeld = false;
            holderCount -= 1;

            if (holderCount === 0) {
                cached = undefined;
                notifiedSnapshot = undefined;
            }
        };
    };

    return {
        name,

        retain,

        subscribe: listener => {
            // Holding the build too: a listener that was told the index changed will be read
            // sooner or later, and rebuilding it in between would be work nobody asked for.
            const release = retain();
            listeners.add(listener);

            return () => {
                if (!listeners.delete(listener)) {
                    return;
                }
                release();
            };
        },

        getSubscriberCount: () => holderCount,

        read,

        getById: (state, id) => read(state).byId.get(id),

        getIds: state => read(state).ids,

        getBy: (state, groupName, key) =>
            read(state).groups[groupName].get(key)?.entities ??
            (EMPTY_ENTITIES as readonly TEntity[]),

        getIdsBy: (state, groupName, key) =>
            read(state).groups[groupName].get(key)?.ids ?? (EMPTY_ENTITY_IDS as readonly TId[]),
    };
};
