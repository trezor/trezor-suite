/**
 * Lazily maintained derived indexes over store entities.
 *
 * A primary index and any number of secondary indexes computed from a Redux slice on first read,
 * rebuilt only for the partitions that changed, with stable array identities for unchanged keys.
 */

export type EntityId = string;

export type EntityIndexChanges<TId extends EntityId> = {
    readonly added: readonly TId[];
    readonly removed: readonly TId[];
    readonly updated: readonly TId[];
};

export type SecondaryKeyExtractor<TEntity, TKey extends EntityId = EntityId> = (
    entity: TEntity,
) => TKey | readonly TKey[] | undefined;

export type SecondaryKeyExtractors<TEntity> = Record<string, SecondaryKeyExtractor<TEntity>>;

export type SecondaryKey<TSelector> =
    TSelector extends SecondaryKeyExtractor<never, infer TKey> ? TKey : never;

export type SecondaryIndexEntry<TEntity, TId extends EntityId> = {
    readonly ids: readonly TId[];
    readonly entities: readonly TEntity[];
};

export type EntityIndexSnapshot<
    TEntity,
    TId extends EntityId,
    TSecondaryIndexes extends SecondaryKeyExtractors<TEntity>,
> = {
    readonly ids: readonly TId[];
    readonly byId: ReadonlyMap<TId, TEntity>;
    readonly secondaryIndexes: {
        readonly [TName in keyof TSecondaryIndexes]: ReadonlyMap<
            SecondaryKey<TSecondaryIndexes[TName]>,
            SecondaryIndexEntry<TEntity, TId>
        >;
    };
    readonly changes: EntityIndexChanges<TId>;
};

export type EntityIndexPartition<TPartition> = readonly [key: string, partition: TPartition];

/** `getPartitions` makes a rebuild cost the write, not the store; without it the source is one partition. */
export type EntityIndexDefinition<
    TState,
    TSource,
    TPartition,
    TEntity,
    TId extends EntityId,
    TSecondaryIndexes extends SecondaryKeyExtractors<TEntity>,
> = {
    name: string;
    selectSource: (state: TState) => TSource;
    getPartitions?: (source: TSource) => Iterable<EntityIndexPartition<TPartition>>;
    /** Without it a partition is taken to be its entities. */
    getEntities?: (partition: TPartition) => Iterable<TEntity>;
    getId: (entity: TEntity) => TId;
    secondaryIndexes?: TSecondaryIndexes;
};

export type EntityIndexListener<
    TEntity,
    TId extends EntityId,
    TSecondaryIndexes extends SecondaryKeyExtractors<TEntity>,
> = (snapshot: EntityIndexSnapshot<TEntity, TId, TSecondaryIndexes>) => void;

export type EntityIndex<
    TState,
    TEntity,
    TId extends EntityId,
    TSecondaryIndexes extends SecondaryKeyExtractors<TEntity> = Record<string, never>,
> = {
    readonly name: string;
    /**
     * Called from inside the `read` that found the change — nothing is noticed until something
     * reads the index. A listener therefore runs during that read, which for a `useSelector`
     * consumer is during render: it must neither dispatch nor set React state.
     */
    subscribe: (listener: EntityIndexListener<TEntity, TId, TSecondaryIndexes>) => () => void;
    getListenerCount: () => number;
    read: (state: TState) => EntityIndexSnapshot<TEntity, TId, TSecondaryIndexes>;
    getById: (state: TState, id: TId) => TEntity | undefined;
    getByIds: (state: TState, ids: Iterable<TId>) => readonly TEntity[];
    getAllExcept: (
        state: TState,
        excluded: readonly TId[] | ReadonlySet<TId>,
    ) => readonly TEntity[];
    getIds: (state: TState) => readonly TId[];
    getBySecondaryKey: <TName extends keyof TSecondaryIndexes>(
        state: TState,
        indexName: TName,
        key: SecondaryKey<TSecondaryIndexes[TName]>,
    ) => readonly TEntity[];
    getIdsBySecondaryKey: <TName extends keyof TSecondaryIndexes>(
        state: TState,
        indexName: TName,
        key: SecondaryKey<TSecondaryIndexes[TName]>,
    ) => readonly TId[];
};

const NO_CHANGES: EntityIndexChanges<never> = { added: [], removed: [], updated: [] };

export const EMPTY_ENTITY_IDS: readonly never[] = [];

export const EMPTY_ENTITIES: readonly never[] = [];

const WHOLE_SOURCE_KEY = '';

const setsByList = new WeakMap<object, ReadonlySet<unknown>>();

const toIdSet = <TId extends EntityId>(ids: readonly TId[]): ReadonlySet<TId> => {
    const known = setsByList.get(ids);

    if (known !== undefined) {
        return known as ReadonlySet<TId>;
    }

    const set = new Set<TId>(ids);
    setsByList.set(ids, set);

    return set;
};

type PartitionSecondaryKeys = readonly (EntityId | readonly EntityId[] | undefined)[];

type BuiltPartition<TEntity, TId extends EntityId> = {
    partition: unknown;
    ids: readonly TId[];
    entities: readonly TEntity[];
    secondaryKeys: Map<string, PartitionSecondaryKeys>;
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

type WalkedPartition<TEntity, TId extends EntityId> = {
    key: string;
    built: BuiltPartition<TEntity, TId>;
    isDirty: boolean;
};

type Identities<TEntity, TId extends EntityId> = {
    ids: readonly TId[];
    byId: ReadonlyMap<TId, TEntity>;
};

const identitiesOf = <TEntity, TId extends EntityId>(
    walked: readonly WalkedPartition<TEntity, TId>[],
): Identities<TEntity, TId> => {
    const byId = new Map<TId, TEntity>();
    const ids: TId[] = [];

    for (const { built } of walked) {
        const { ids: partitionIds, entities } = built;

        for (let position = 0; position < partitionIds.length; position++) {
            const id = partitionIds[position] as TId;

            if (!byId.has(id)) {
                ids.push(id);
            }
            byId.set(id, entities[position] as TEntity);
        }
    }

    return { ids: ids.length === 0 ? EMPTY_ENTITY_IDS : ids, byId };
};

/** Holds the partitions it was walked with and nothing else, so a build cannot keep the one before it alive. */
const lazyIdentitiesOf = <TEntity, TId extends EntityId>(
    walked: readonly WalkedPartition<TEntity, TId>[],
) => {
    let built: Identities<TEntity, TId> | undefined;

    return () => (built ??= identitiesOf(walked));
};

const areSame = <TItem>(left: readonly TItem[], right: readonly TItem[]) =>
    left.length === right.length && left.every((item, index) => item === right[index]);

export const createEntityIndex = <
    TState,
    TSource,
    TEntity,
    TId extends EntityId,
    TSecondaryIndexes extends SecondaryKeyExtractors<TEntity> = Record<string, never>,
    TPartition = TSource,
>({
    name,
    selectSource,
    getPartitions,
    getEntities,
    getId,
    secondaryIndexes: secondaryKeyExtractors,
}: EntityIndexDefinition<
    TState,
    TSource,
    TPartition,
    TEntity,
    TId,
    TSecondaryIndexes
>): EntityIndex<TState, TEntity, TId, TSecondaryIndexes> => {
    const indexNames = Object.keys(secondaryKeyExtractors ?? {});

    const toEntities =
        getEntities ?? ((partition: TPartition) => partition as unknown as Iterable<TEntity>);

    const emptySecondaryIndexes = () =>
        Object.fromEntries(
            indexNames.map(indexName => [indexName, new Map()]),
        ) as unknown as EntityIndexSnapshot<TEntity, TId, TSecondaryIndexes>['secondaryIndexes'];

    const emptySnapshot: EntityIndexSnapshot<TEntity, TId, TSecondaryIndexes> = {
        ids: [],
        byId: new Map(),
        secondaryIndexes: emptySecondaryIndexes(),
        changes: NO_CHANGES,
    };

    const toPartitions =
        getPartitions ??
        ((source: TSource) => [[WHOLE_SOURCE_KEY, source as unknown as TPartition]] as const);

    let demandedIndexes = new Set<string>();

    const entitiesExcept = new WeakMap<object, WeakMap<object, readonly unknown[]>>();

    const entitiesByIds = new WeakMap<object, WeakMap<object, readonly unknown[]>>();

    const listeners = new Set<EntityIndexListener<TEntity, TId, TSecondaryIndexes>>();
    let notifiedSnapshot: EntityIndexSnapshot<TEntity, TId, TSecondaryIndexes> | undefined;
    let cached:
        | {
              source: TSource;
              snapshot: EntityIndexSnapshot<TEntity, TId, TSecondaryIndexes>;
              partitions: ReadonlyMap<string, BuiltPartition<TEntity, TId>>;
              builtIndexes: Map<string, ReadonlyMap<EntityId, SecondaryIndexEntry<TEntity, TId>>>;
              identities: () => { ids: readonly TId[]; byId: ReadonlyMap<TId, TEntity> };
          }
        | undefined;

    const buildPartition = (partition: TPartition): BuiltPartition<TEntity, TId> => {
        const ids: TId[] = [];
        const entities: TEntity[] = [];
        const source = toEntities(partition);

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

        return { partition, ids, entities, secondaryKeys: new Map() };
    };

    const keysOfPartition = (
        built: BuiltPartition<TEntity, TId>,
        indexName: string,
    ): PartitionSecondaryKeys => {
        const known = built.secondaryKeys.get(indexName);

        if (known !== undefined) {
            return known;
        }

        const selectKey = secondaryKeyExtractors?.[indexName];
        const keys = built.entities.map(entity => selectKey?.(entity));
        built.secondaryKeys.set(indexName, keys);

        return keys;
    };

    const assembleSecondaryIndexes = (
        indexesToBuild: readonly string[],
        walked: readonly WalkedPartition<TEntity, TId>[],
        previousPartitions: ReadonlyMap<string, BuiltPartition<TEntity, TId>> | undefined,
        gonePartitions: readonly BuiltPartition<TEntity, TId>[],
        previousSecondaryIndexes: ReadonlyMap<
            string,
            ReadonlyMap<EntityId, SecondaryIndexEntry<TEntity, TId>>
        >,
        isPartitionOrderKept: boolean,
    ): Map<string, ReadonlyMap<EntityId, SecondaryIndexEntry<TEntity, TId>>> => {
        const assembled = indexesToBuild.map(
            () => new Map<EntityId, { ids: TId[]; entities: TEntity[] }>(),
        );
        const dirtyKeys = indexesToBuild.map(() => new Set<EntityId>());

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

            if (held.ids[held.ids.length - 1] === id) {
                return;
            }

            held.ids.push(id);
            held.entities.push(entity);
        };

        for (const { built, isDirty } of walked) {
            const { ids, entities } = built;

            for (let indexPosition = 0; indexPosition < indexesToBuild.length; indexPosition++) {
                const keys = keysOfPartition(built, indexesToBuild[indexPosition] as string);
                const members = assembled[indexPosition] as Map<
                    EntityId,
                    { ids: TId[]; entities: TEntity[] }
                >;
                const dirty = dirtyKeys[indexPosition] as Set<EntityId>;

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

        const goneWithWalked = [
            ...walked.flatMap(({ key, isDirty }) =>
                isDirty ? [previousPartitions?.get(key)] : [],
            ),
            ...gonePartitions,
        ];

        indexesToBuild.forEach((indexName, indexPosition) => {
            const dirty = dirtyKeys[indexPosition] as Set<EntityId>;

            goneWithWalked.forEach(gone => {
                if (gone === undefined) {
                    return;
                }

                keysOfPartition(gone, indexName).forEach(keys =>
                    forEachKey(keys, goneKey => dirty.add(goneKey)),
                );
            });
        });

        return new Map(
            indexesToBuild.map((indexName, indexPosition) => {
                const previousEntries = previousSecondaryIndexes.get(indexName);
                const built = assembled[indexPosition] as Map<
                    EntityId,
                    { ids: TId[]; entities: TEntity[] }
                >;
                const dirty = dirtyKeys[indexPosition] as Set<EntityId>;
                const settled = new Map<EntityId, SecondaryIndexEntry<TEntity, TId>>();
                let isUnchanged = previousEntries?.size === built.size;

                built.forEach((members, key) => {
                    const previousMembers = previousEntries?.get(key);
                    const isKept =
                        previousMembers !== undefined &&
                        ((isPartitionOrderKept && !dirty.has(key)) ||
                            areSame(previousMembers.entities, members.entities));

                    if (isKept) {
                        settled.set(key, previousMembers);
                    } else {
                        settled.set(key, members);
                        isUnchanged = false;
                    }
                });

                return [indexName, isUnchanged && previousEntries ? previousEntries : settled];
            }),
        );
    };

    const build = (source: TSource): EntityIndexSnapshot<TEntity, TId, TSecondaryIndexes> => {
        // Only what this build needs, never `cached` itself: a closure over it would keep every
        // build before this one alive for as long as the index lives.
        const previousPartitions = cached?.partitions;
        const previousBuiltIndexes = cached?.builtIndexes;
        const previousIdentities = cached?.identities;
        const wasEmpty = cached === undefined || cached.snapshot === emptySnapshot;

        const partitions = new Map<string, BuiltPartition<TEntity, TId>>();
        const walked: WalkedPartition<TEntity, TId>[] = [];
        let entityCount = 0;

        const possiblyRemoved: TId[] = [];

        for (const [partitionKey, partition] of toPartitions(source)) {
            const previousPartition = previousPartitions?.get(partitionKey);
            const isUntouched = previousPartition?.partition === partition;
            const builtPartition =
                isUntouched && previousPartition ? previousPartition : buildPartition(partition);

            partitions.set(partitionKey, builtPartition);
            walked.push({ key: partitionKey, built: builtPartition, isDirty: !isUntouched });
            entityCount += builtPartition.ids.length;

            if (!isUntouched && previousPartition) {
                previousPartition.ids.forEach(id => possiblyRemoved.push(id));
            }
        }

        const gonePartitions: BuiltPartition<TEntity, TId>[] = [];

        previousPartitions?.forEach((previousPartition, partitionKey) => {
            if (!partitions.has(partitionKey)) {
                gonePartitions.push(previousPartition);
                previousPartition.ids.forEach(id => possiblyRemoved.push(id));
            }
        });

        const isPartitionOrderKept =
            previousPartitions !== undefined &&
            gonePartitions.length === 0 &&
            areSame([...partitions.keys()], [...previousPartitions.keys()]);

        const builtIndexes = new Map<
            string,
            ReadonlyMap<EntityId, SecondaryIndexEntry<TEntity, TId>>
        >();
        const secondaryIndexes = {} as EntityIndexSnapshot<
            TEntity,
            TId,
            TSecondaryIndexes
        >['secondaryIndexes'];

        const wantedIndexes = demandedIndexes;
        demandedIndexes = new Set<string>();

        indexNames.forEach(indexName => {
            Object.defineProperty(secondaryIndexes, indexName, {
                enumerable: true,
                get: () => {
                    demandedIndexes.add(indexName);

                    const known = builtIndexes.get(indexName);

                    if (known !== undefined) {
                        return known;
                    }

                    assembleSecondaryIndexes(
                        [
                            indexName,
                            ...indexNames.filter(
                                wanted =>
                                    wanted !== indexName &&
                                    wantedIndexes.has(wanted) &&
                                    !builtIndexes.has(wanted),
                            ),
                        ],
                        walked,
                        previousPartitions,
                        gonePartitions,
                        previousBuiltIndexes ?? new Map(),
                        isPartitionOrderKept,
                    ).forEach((entries, builtName) => builtIndexes.set(builtName, entries));

                    return builtIndexes.get(indexName) as ReadonlyMap<
                        EntityId,
                        SecondaryIndexEntry<TEntity, TId>
                    >;
                },
            });
        });

        const identities = lazyIdentitiesOf(walked);

        const changesOf = (): EntityIndexChanges<TId> => {
            if (previousIdentities === undefined) {
                return NO_CHANGES;
            }

            const { byId } = identities();
            const previousById = previousIdentities().byId;
            const added: TId[] = [];
            const updated: TId[] = [];

            for (const { built: partition, isDirty } of walked) {
                if (!isDirty) {
                    continue;
                }

                partition.ids.forEach((id, position) => {
                    const previousEntity = previousById.get(id);

                    if (previousEntity === undefined) {
                        added.push(id);
                    } else if (previousEntity !== partition.entities[position]) {
                        updated.push(id);
                    }
                });
            }

            return { added, removed: possiblyRemoved.filter(id => !byId.has(id)), updated };
        };

        let changes: EntityIndexChanges<TId> | undefined;

        const isEmpty = entityCount === 0 && wasEmpty;
        const snapshot: EntityIndexSnapshot<TEntity, TId, TSecondaryIndexes> = isEmpty
            ? emptySnapshot
            : {
                  get ids() {
                      return identities().ids;
                  },
                  get byId() {
                      return identities().byId;
                  },
                  secondaryIndexes,
                  get changes() {
                      if (changes === undefined) {
                          changes = changesOf();
                      }

                      return changes;
                  },
              };

        cached = { source, partitions, builtIndexes, identities, snapshot };

        return cached.snapshot;
    };

    const notify = (snapshot: EntityIndexSnapshot<TEntity, TId, TSecondaryIndexes>) => {
        if (listeners.size === 0 || snapshot === notifiedSnapshot) {
            return;
        }
        notifiedSnapshot = snapshot;

        listeners.forEach(listener => {
            try {
                listener(snapshot);
            } catch (error) {
                console.error(`entity index "${name}" listener failed`, error);
            }
        });
    };

    const read = (state: TState): EntityIndexSnapshot<TEntity, TId, TSecondaryIndexes> => {
        const source = selectSource(state);

        if (cached?.source === source) {
            return cached.snapshot;
        }

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

        getAllExcept: (state, excluded) => {
            const { byId } = read(state);
            const excludedSet =
                excluded instanceof Set ? excluded : toIdSet(excluded as readonly TId[]);
            const known = entitiesExcept.get(byId)?.get(excludedSet);

            if (known !== undefined) {
                return known as readonly TEntity[];
            }

            const entities: TEntity[] = [];

            for (const [id, entity] of byId) {
                if (!excludedSet.has(id)) {
                    entities.push(entity);
                }
            }

            const remaining = entities.length === 0 ? EMPTY_ENTITIES : entities;
            const forMap = entitiesExcept.get(byId) ?? new WeakMap<object, readonly unknown[]>();
            forMap.set(excludedSet, remaining);
            entitiesExcept.set(byId, forMap);

            return remaining;
        },

        getByIds: (state, ids) => {
            const { byId } = read(state);
            const known = typeof ids === 'object' ? entitiesByIds.get(byId)?.get(ids) : undefined;

            if (known !== undefined) {
                return known as readonly TEntity[];
            }

            const found: TEntity[] = [];

            for (const id of ids) {
                const entity = byId.get(id);

                if (entity !== undefined) {
                    found.push(entity);
                }
            }

            const entities = found.length === 0 ? EMPTY_ENTITIES : found;

            if (typeof ids === 'object') {
                const forMap = entitiesByIds.get(byId) ?? new WeakMap<object, readonly unknown[]>();
                forMap.set(ids, entities);
                entitiesByIds.set(byId, forMap);
            }

            return entities;
        },

        getIds: state => read(state).ids,

        getBySecondaryKey: (state, indexName, key) =>
            read(state).secondaryIndexes[indexName].get(key)?.entities ?? EMPTY_ENTITIES,

        getIdsBySecondaryKey: (state, indexName, key) =>
            read(state).secondaryIndexes[indexName].get(key)?.ids ?? EMPTY_ENTITY_IDS,
    };
};
