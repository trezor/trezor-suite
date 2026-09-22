/**
 * The vocabulary of a lazily maintained derived index: a primary index (`ids`, `byId`) and any
 * number of secondary indexes over one Redux slice, rebuilt only for the partitions that changed.
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

/**
 * What a read hands back. Every answer is a method because every answer is work the build put
 * off: asking for the ids walks the partitions, asking for a secondary index assembles it, and
 * asking what changed diffs against the build before. Each is done once per snapshot.
 */
export type EntityIndexSnapshot<
    TEntity,
    TId extends EntityId,
    TSecondaryIndexes extends SecondaryKeyExtractors<TEntity>,
> = {
    getIds: () => readonly TId[];
    getEntitiesById: () => ReadonlyMap<TId, TEntity>;
    getSecondaryIndex: <TName extends keyof TSecondaryIndexes>(
        indexName: TName,
    ) => ReadonlyMap<SecondaryKey<TSecondaryIndexes[TName]>, SecondaryIndexEntry<TEntity, TId>>;
    getChanges: () => EntityIndexChanges<TId>;
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
