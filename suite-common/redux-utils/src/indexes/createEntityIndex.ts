export type EntityId = string;

export type EntityIndexChanges<TId extends EntityId> = {
    readonly added: readonly TId[];
    readonly removed: readonly TId[];
    readonly updated: readonly TId[];
};

export type EntityGroupKeySelector<TEntity, TKey extends EntityId = EntityId> = (
    entity: TEntity,
) => TKey | readonly TKey[] | undefined;

export type EntityGroupKeySelectors<TEntity> = Record<string, EntityGroupKeySelector<TEntity>>;

export type EntityGroupKey<TSelector> =
    TSelector extends EntityGroupKeySelector<never, infer TKey> ? TKey : never;

export type EntityGroup<TEntity, TId extends EntityId> = {
    readonly ids: readonly TId[];
    readonly entities: readonly TEntity[];
};

export type EntityIndexSnapshot<
    TEntity,
    TId extends EntityId,
    TGroups extends EntityGroupKeySelectors<TEntity>,
> = {
    readonly ids: readonly TId[];
    readonly byId: ReadonlyMap<TId, TEntity>;
    readonly groups: {
        readonly [TName in keyof TGroups]: ReadonlyMap<
            EntityGroupKey<TGroups[TName]>,
            EntityGroup<TEntity, TId>
        >;
    };
    readonly changes: EntityIndexChanges<TId>;
};

export type EntityIndexPart<TPart> = readonly [key: string, part: TPart];

/** `getParts` makes a rebuild cost the write, not the store; without it the source is one part. */
export type EntityIndexDefinition<
    TState,
    TSource,
    TPart,
    TEntity,
    TId extends EntityId,
    TGroups extends EntityGroupKeySelectors<TEntity>,
> = {
    name: string;
    selectSource: (state: TState) => TSource;
    getParts?: (source: TSource) => Iterable<EntityIndexPart<TPart>>;
    /** Without it a part is taken to be its entities. */
    getEntities?: (part: TPart) => Iterable<TEntity>;
    getId: (entity: TEntity) => TId;
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
    /** Called from inside the read that found the change, so a listener must not dispatch. */
    subscribe: (listener: EntityIndexListener<TEntity, TId, TGroups>) => () => void;
    getListenerCount: () => number;
    read: (state: TState) => EntityIndexSnapshot<TEntity, TId, TGroups>;
    getById: (state: TState, id: TId) => TEntity | undefined;
    getByIds: (state: TState, ids: Iterable<TId>) => readonly TEntity[];
    getInverseOfIds: (
        state: TState,
        excluded: readonly TId[] | ReadonlySet<TId>,
    ) => readonly TEntity[];
    getIds: (state: TState) => readonly TId[];
    getBy: <TName extends keyof TGroups>(
        state: TState,
        groupName: TName,
        key: EntityGroupKey<TGroups[TName]>,
    ) => readonly TEntity[];
    getIdsBy: <TName extends keyof TGroups>(
        state: TState,
        groupName: TName,
        key: EntityGroupKey<TGroups[TName]>,
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

type PartGroupKeys = readonly (EntityId | readonly EntityId[] | undefined)[];

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

    const toEntities = getEntities ?? ((part: TPart) => part as unknown as Iterable<TEntity>);

    const emptyGroups = () =>
        Object.fromEntries(
            groupNames.map(groupName => [groupName, new Map()]),
        ) as unknown as EntityIndexSnapshot<TEntity, TId, TGroups>['groups'];

    const emptySnapshot: EntityIndexSnapshot<TEntity, TId, TGroups> = {
        ids: [],
        byId: new Map(),
        groups: emptyGroups(),
        changes: NO_CHANGES,
    };

    const toParts =
        getParts ??
        ((source: TSource) => [[WHOLE_SOURCE_KEY, source as unknown as TPart]] as const);

    let demandedGroups = new Set<string>();

    const inverseEntities = new WeakMap<object, WeakMap<object, readonly unknown[]>>();

    const listeners = new Set<EntityIndexListener<TEntity, TId, TGroups>>();
    let notifiedSnapshot: EntityIndexSnapshot<TEntity, TId, TGroups> | undefined;
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
        const source = toEntities(part);

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

    type WalkedPart = { key: string; built: BuiltPart<TEntity, TId>; isDirty: boolean };

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

            if (held.ids[held.ids.length - 1] === id) {
                return;
            }

            held.ids.push(id);
            held.entities.push(entity);
        };

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

        let builtIdentities: Identities | undefined;

        const identities = () => {
            if (builtIdentities === undefined) {
                builtIdentities = identitiesOf(walked);
            }

            return builtIdentities;
        };

        const changesOf = (): EntityIndexChanges<TId> => {
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
