/**
 * The vocabulary of a lazily maintained derived index: a primary index (`ids`, `byId`) and any
 * number of secondary indexes over one Redux slice, rebuilt only for the partitions that changed.
 */

export type EntityId = string;

/**
 * A secondary key once the index holds it, with whatever it meant to the extractor rubbed off —
 * `SecondaryKey` is what the caller asks with and gets back.
 */
export type AnySecondaryKey = string;

export type EntityIndexChanges<TId extends EntityId> = {
    readonly added: readonly TId[];
    readonly removed: readonly TId[];
    readonly updated: readonly TId[];
};

/**
 * What an entity is looked up by, other than its id: one key, or none.
 *
 * A secondary index here is always the grouping kind: a key names every entity that answers to it,
 * rather than at most one the way a unique index would — a lookup gives back what is under the
 * key, never a single entity. Naming exactly one entity is what the id is for.
 *
 * An entity that belongs under several keys is several entities: `getEntities` flattens it, the
 * way an account is flattened into what it holds, and then each of them has its one key.
 */
export type SecondaryKeyExtractor<TEntity, TKey extends EntityId = EntityId> = (
    entity: TEntity,
) => TKey | undefined;

export type SecondaryKeyExtractors<TEntity> = Record<string, SecondaryKeyExtractor<TEntity>>;

export type SecondaryKey<TSelector> =
    TSelector extends SecondaryKeyExtractor<never, infer TKey> ? TKey : never;

/** Everything under one secondary key, in the order the partitions hold it. */
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

export type EntityIndexDefinition<
    TState,
    TSource,
    TEntity,
    TId extends EntityId,
    TSecondaryIndexes extends SecondaryKeyExtractors<TEntity>,
> = {
    name: string;
    selectSource: (state: TState) => TSource;
    /**
     * What the source holds, derived on every read that finds a new source — so an index over a
     * slice that is written often derives with a `WeakMap` of its own. Without it the source is
     * taken to be its entities.
     */
    getEntities?: (source: TSource) => Iterable<TEntity>;
    /** What the index knows an entity by. Two entities of one source may not share it. */
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
