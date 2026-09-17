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
 *   nothing but the definition, and what it builds is kept only until the source changes.
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
    /** How many listeners are subscribed. Exposed for tests and dev tooling. */
    getListenerCount: () => number;
    /** The index as of this state. Same object for as long as the source is unchanged. */
    read: (state: TState) => EntityIndexSnapshot<TEntity, TId, TGroups>;
    getById: (state: TState, id: TId) => TEntity | undefined;
    getByIds: (state: TState, ids: Iterable<TId>) => readonly TEntity[];
    /**
     * Everything the index holds except the entities named by `excluded` — a list of what is
     * hidden, typically — in the index's own order.
     *
     * The same array for as long as the index and that list are unchanged, so it can be read
     * straight into a component. Pass the list itself rather than building it at the call site:
     * a fresh array each time is a fresh answer each time.
     */
    getInverseOfIds: (
        state: TState,
        excluded: readonly TId[] | ReadonlySet<TId>,
    ) => readonly TEntity[];
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

const setsByList = new WeakMap<object, ReadonlySet<unknown>>();

// One set per list, so a consumer passing the same list is not charged for building it again.
const toIdSet = <TId extends EntityId>(ids: readonly TId[]): ReadonlySet<TId> => {
    const known = setsByList.get(ids);

    if (known !== undefined) {
        return known as ReadonlySet<TId>;
    }

    const set = new Set<TId>(ids);
    setsByList.set(ids, set);

    return set;
};

type PartGroupKeys = readonly (EntityId | readonly EntityId[] | undefined)[];

/**
 * What a part contributed last time, so an untouched part can contribute it again without being
 * walked: its entities and their ids, in parallel arrays, and the group keys derived from them —
 * one group at a time, the first time that group is read.
 */
type BuiltPart<TEntity, TId extends EntityId> = {
    part: unknown;
    ids: readonly TId[];
    entities: readonly TEntity[];
    groupKeys: Map<string, PartGroupKeys>;
};

const forEachKey = (
    keys: EntityId | readonly EntityId[] | undefined,
    visit: (key: EntityId) => void,
) => {
    if (keys === undefined) {
        return;
    }

    if (Array.isArray(keys)) {
        for (const key of keys) {
            visit(key);
        }

        return;
    }

    visit(keys as EntityId);
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

    // Groups a consumer read from the last build, so the next build assembles them in the walk it
    // is doing anyway. A group nobody reads again drops out of the set, and back to costing nothing.
    let demandedGroups = new Set<string>();

    // Keyed on the build's own lookup and then the excluded list, so the answer is made once per
    // build per list.
    const inverseEntities = new WeakMap<object, WeakMap<object, readonly unknown[]>>();

    const listeners = new Set<EntityIndexListener<TEntity, TId, TGroups>>();
    let notifiedSnapshot: EntityIndexSnapshot<TEntity, TId, TGroups> | undefined;
    // The build, the source it was built from and the parts it was assembled from, kept together
    // so they cannot disagree. `undefined` means the next read builds from nothing.
    let cached:
        | {
              source: TSource;
              snapshot: EntityIndexSnapshot<TEntity, TId, TGroups>;
              parts: ReadonlyMap<string, BuiltPart<TEntity, TId>>;
              materialisedGroups: Map<string, ReadonlyMap<EntityId, EntityGroup<TEntity, TId>>>;
              identities: () => { ids: readonly TId[]; byId: ReadonlyMap<TId, TEntity> };
          }
        | undefined;

    const buildPart = (part: TPart): BuiltPart<TEntity, TId> => {
        const ids: TId[] = [];
        const entities: TEntity[] = [];
        const source = getEntities(part);

        if (Array.isArray(source)) {
            for (let position = 0; position < source.length; position++) {
                const entity = source[position] as TEntity;
                ids.push(getId(entity));
                entities.push(entity);
            }
        } else {
            for (const entity of source) {
                ids.push(getId(entity));
                entities.push(entity);
            }
        }

        return { part, ids, entities, groupKeys: new Map() };
    };

    // Derived per group rather than for every group at once, so an index whose consumers read one
    // group never calls the others' selectors. Kept on the part, so an untouched part keeps them.
    const keysOfPart = (built: BuiltPart<TEntity, TId>, groupName: string): PartGroupKeys => {
        const known = built.groupKeys.get(groupName);

        if (known !== undefined) {
            return known;
        }

        const selectKey = groupBy?.[groupName];
        const keys = built.entities.map(entity => selectKey?.(entity));
        built.groupKeys.set(groupName, keys);

        return keys;
    };

    /**
     * Reuses the previous array for every group whose members are unchanged, so that a consumer
     * watching one group is not re-rendered by a write to another. The comparison is by identity
     * over ids the rebuild has already produced, which is cheaper than what the consumer would
     * otherwise do on every write.
     */
    type WalkedPart = { key: string; built: BuiltPart<TEntity, TId>; isDirty: boolean };

    /**
     * One group, assembled from the parts and settled against the last build of the same group.
     *
     * A key only fed by parts that were not walked holds what it held before, so its array is
     * reused without comparing — but only while the parts come in the same order, because order
     * decides the order of a group's members. Keys a walked or vanished part had a hand in are
     * compared, so a write that left a group alone still hands back the same array.
     */
    /**
     * The named groups, assembled from the parts in one walk and settled against the last build.
     *
     * Several groups at once because the walk is the same walk: the parts and their entities are
     * visited once and every group being assembled is filled from that visit.
     *
     * A key only fed by parts that were not walked holds what it held before, so its array is
     * reused without comparing — but only while the parts come in the same order, because order
     * decides the order of a group's members. Keys a walked or vanished part had a hand in are
     * compared, so a write that left a group alone still hands back the same array.
     */
    const assembleGroups = (
        groupsToBuild: readonly string[],
        walked: readonly WalkedPart[],
        previousParts: ReadonlyMap<string, BuiltPart<TEntity, TId>> | undefined,
        goneParts: readonly BuiltPart<TEntity, TId>[],
        previousGroups: ReadonlyMap<string, ReadonlyMap<EntityId, EntityGroup<TEntity, TId>>>,
        isPartOrderKept: boolean,
    ): Map<string, ReadonlyMap<EntityId, EntityGroup<TEntity, TId>>> => {
        const assembled = groupsToBuild.map(
            () => new Map<EntityId, { ids: TId[]; entities: TEntity[] }>(),
        );
        const dirtyKeys = groupsToBuild.map(() => new Set<EntityId>());

        const fileUnder = (
            members: Map<EntityId, { ids: TId[]; entities: TEntity[] }>,
            key: EntityId,
            id: TId,
            entity: TEntity,
        ) => {
            const held = members.get(key);

            if (held === undefined) {
                members.set(key, { ids: [id], entities: [entity] });

                return;
            }

            // An entity that names the same key twice — a transaction paying an address from an
            // input and to a target, say — belongs to the group once. Its keys are handled
            // together, so a repeat is always the last one in.
            if (held.ids[held.ids.length - 1] === id) {
                return;
            }

            held.ids.push(id);
            held.entities.push(entity);
        };

        // Group by group within each part, so the map, the dirty set and the part's keys are
        // looked up once per group rather than once per entity.
        for (const { built, isDirty } of walked) {
            const { ids, entities } = built;

            for (let groupIndex = 0; groupIndex < groupsToBuild.length; groupIndex++) {
                const keys = keysOfPart(built, groupsToBuild[groupIndex] as string);
                const members = assembled[groupIndex] as Map<
                    EntityId,
                    { ids: TId[]; entities: TEntity[] }
                >;
                const dirty = dirtyKeys[groupIndex] as Set<EntityId>;

                for (let position = 0; position < ids.length; position++) {
                    const keysAt = keys[position];

                    if (keysAt === undefined) {
                        continue;
                    }

                    const id = ids[position] as TId;
                    const entity = entities[position] as TEntity;

                    if (Array.isArray(keysAt)) {
                        for (const key of keysAt) {
                            if (isDirty) {
                                dirty.add(key);
                            }

                            fileUnder(members, key, id, entity);
                        }

                        continue;
                    }

                    if (isDirty) {
                        dirty.add(keysAt as EntityId);
                    }

                    fileUnder(members, keysAt as EntityId, id, entity);
                }
            }
        }

        // What a walked part used to hold, and what a vanished part held, decide keys too: a key
        // can have lost the only member that put it there.
        const goneWithWalked = [
            ...walked.flatMap(({ key, isDirty }) => (isDirty ? [previousParts?.get(key)] : [])),
            ...goneParts,
        ];

        groupsToBuild.forEach((group, groupIndex) => {
            const dirty = dirtyKeys[groupIndex] as Set<EntityId>;

            goneWithWalked.forEach(gone => {
                if (gone === undefined) {
                    return;
                }

                keysOfPart(gone, group).forEach(keys =>
                    forEachKey(keys, gonekey => dirty.add(gonekey)),
                );
            });
        });

        return new Map(
            groupsToBuild.map((group, groupIndex) => {
                const previousGroup = previousGroups.get(group);
                const built = assembled[groupIndex] as Map<
                    EntityId,
                    { ids: TId[]; entities: TEntity[] }
                >;
                const dirty = dirtyKeys[groupIndex] as Set<EntityId>;
                const settled = new Map<EntityId, EntityGroup<TEntity, TId>>();
                let isUnchanged = previousGroup?.size === built.size;

                built.forEach((members, key) => {
                    const previousMembers = previousGroup?.get(key);
                    const isKept =
                        previousMembers !== undefined &&
                        ((isPartOrderKept && !dirty.has(key)) ||
                            areSame(previousMembers.entities, members.entities));

                    if (isKept) {
                        settled.set(key, previousMembers);
                    } else {
                        settled.set(key, members);
                        isUnchanged = false;
                    }
                });

                return [group, isUnchanged && previousGroup ? previousGroup : settled];
            }),
        );
    };

    type Identities = { ids: readonly TId[]; byId: ReadonlyMap<TId, TEntity> };

    const identitiesOf = (walked: readonly WalkedPart[]): Identities => {
        const byId = new Map<TId, TEntity>();
        const ids: TId[] = [];

        for (const { built } of walked) {
            const { ids: partIds, entities } = built;

            for (let position = 0; position < partIds.length; position++) {
                const id = partIds[position] as TId;

                // A repeated id means `getId` does not identify these entities. The last one wins,
                // the way a write to the same key would, and the id keeps its first position.
                if (!byId.has(id)) {
                    ids.push(id);
                }
                byId.set(id, entities[position] as TEntity);
            }
        }

        return { ids, byId };
    };

    const build = (source: TSource): EntityIndexSnapshot<TEntity, TId, TGroups> => {
        const previous = cached;
        const parts = new Map<string, BuiltPart<TEntity, TId>>();
        const walked: WalkedPart[] = [];
        let entityCount = 0;

        // Only ids the rebuilt or vanished parts used to hold can have gone; everything else was
        // carried over untouched. Checked against the finished index below, because an id can move
        // between parts.
        const possiblyRemoved: TId[] = [];

        for (const [partKey, part] of toParts(source)) {
            const previousPart = previous?.parts.get(partKey);
            const isUntouched = previousPart?.part === part;
            const builtPart = isUntouched && previousPart ? previousPart : buildPart(part);

            parts.set(partKey, builtPart);
            walked.push({ key: partKey, built: builtPart, isDirty: !isUntouched });
            entityCount += builtPart.ids.length;

            if (!isUntouched && previousPart) {
                previousPart.ids.forEach(id => possiblyRemoved.push(id));
            }
        }

        const goneParts: BuiltPart<TEntity, TId>[] = [];

        // Parts the source no longer has at all.
        previous?.parts.forEach((previousPart, partKey) => {
            if (!parts.has(partKey)) {
                goneParts.push(previousPart);
                previousPart.ids.forEach(id => possiblyRemoved.push(id));
            }
        });

        const isPartOrderKept =
            previous !== undefined &&
            goneParts.length === 0 &&
            areSame([...parts.keys()], [...previous.parts.keys()]);

        const materialisedGroups = new Map<
            string,
            ReadonlyMap<EntityId, EntityGroup<TEntity, TId>>
        >();
        const groups = {} as EntityIndexSnapshot<TEntity, TId, TGroups>['groups'];

        const wantedGroups = demandedGroups;
        demandedGroups = new Set<string>();

        // A group nobody reads is never assembled, and its keys are never derived.
        groupNames.forEach(groupName => {
            Object.defineProperty(groups, groupName, {
                enumerable: true,
                get: () => {
                    demandedGroups.add(groupName);

                    const known = materialisedGroups.get(groupName);

                    if (known !== undefined) {
                        return known;
                    }

                    assembleGroups(
                        [
                            groupName,
                            ...groupNames.filter(
                                wanted =>
                                    wanted !== groupName &&
                                    wantedGroups.has(wanted) &&
                                    !materialisedGroups.has(wanted),
                            ),
                        ],
                        walked,
                        previous?.parts,
                        goneParts,
                        previous?.materialisedGroups ?? new Map(),
                        isPartOrderKept,
                    ).forEach((group, built) => materialisedGroups.set(built, group));

                    return materialisedGroups.get(groupName) as ReadonlyMap<
                        EntityId,
                        EntityGroup<TEntity, TId>
                    >;
                },
            });
        });

        // Nothing here is built until it is asked for: a consumer reading groups never pays for
        // the id lookup, and one reading an entity by id never pays for the groups. What a
        // rebuild always pays is the walk over the parts above, which carries the untouched ones
        // over without looking at them.
        let builtIdentities: Identities | undefined;

        const identities = () => {
            if (builtIdentities === undefined) {
                builtIdentities = identitiesOf(walked);
            }

            return builtIdentities;
        };

        const changesOf = (): EntityIndexChanges<TId> => {
            // The very first build is not a change anyone can have missed, and saying so would
            // mean listing every entity in the store.
            if (previous === undefined) {
                return NO_CHANGES;
            }

            const { byId } = identities();
            const previousById = previous.identities().byId;
            const added: TId[] = [];
            const updated: TId[] = [];

            for (const { built: part, isDirty } of walked) {
                if (!isDirty) {
                    continue;
                }

                part.ids.forEach((id, position) => {
                    const previousEntity = previousById.get(id);

                    if (previousEntity === undefined) {
                        added.push(id);
                    } else if (previousEntity !== part.entities[position]) {
                        updated.push(id);
                    }
                });
            }

            return { added, removed: possiblyRemoved.filter(id => !byId.has(id)), updated };
        };

        let changes: EntityIndexChanges<TId> | undefined;

        const isEmpty =
            entityCount === 0 && (previous === undefined || previous.snapshot === emptySnapshot);
        const snapshot: EntityIndexSnapshot<TEntity, TId, TGroups> = isEmpty
            ? emptySnapshot
            : {
                  get ids() {
                      return identities().ids;
                  },
                  get byId() {
                      return identities().byId;
                  },
                  groups,
                  get changes() {
                      if (changes === undefined) {
                          changes = changesOf();
                      }

                      return changes;
                  },
              };

        cached = { source, parts, materialisedGroups, identities, snapshot };

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

        // A list of a hundred rows reads the index a hundred times on its first render; those
        // have to be one build. What is built is then kept until the source is replaced, whether
        // or not anything is subscribed — a reader is never made to pay for a rebuild because a
        // listener came or went.
        const snapshot = build(source);
        notify(snapshot);

        return snapshot;
    };

    return {
        name,

        subscribe: listener => {
            listeners.add(listener);

            return () => {
                listeners.delete(listener);
            };
        },

        getListenerCount: () => listeners.size,

        read,

        getById: (state, id) => read(state).byId.get(id),

        getInverseOfIds: (state, excluded) => {
            const { byId } = read(state);
            const excludedSet =
                excluded instanceof Set ? excluded : toIdSet(excluded as readonly TId[]);
            const known = inverseEntities.get(byId)?.get(excludedSet);

            if (known !== undefined) {
                return known as readonly TEntity[];
            }

            const entities: TEntity[] = [];

            // Walked as the map holds it rather than id by id: the map yields each entity next to
            // its id, which is both the order the index lists them in and one lookup fewer than
            // asking the map for every id in turn.
            for (const [id, entity] of byId) {
                if (!excludedSet.has(id)) {
                    entities.push(entity);
                }
            }

            const inverse = entities.length === 0 ? EMPTY_ENTITIES : entities;
            const forMap = inverseEntities.get(byId) ?? new WeakMap<object, readonly unknown[]>();
            forMap.set(excludedSet, inverse);
            inverseEntities.set(byId, forMap);

            return inverse;
        },

        getByIds: (state, ids) => {
            const { byId } = read(state);
            const entities: TEntity[] = [];

            for (const id of ids) {
                const entity = byId.get(id);

                if (entity !== undefined) {
                    entities.push(entity);
                }
            }

            return entities.length === 0 ? EMPTY_ENTITIES : entities;
        },

        getIds: state => read(state).ids,

        getBy: (state, groupName, key) =>
            read(state).groups[groupName].get(key)?.entities ?? EMPTY_ENTITIES,

        getIdsBy: (state, groupName, key) =>
            read(state).groups[groupName].get(key)?.ids ?? EMPTY_ENTITY_IDS,
    };
};
