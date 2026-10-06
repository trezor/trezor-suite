export type IndexId = string;

export type IndexKey = string;

/** Which ids a build added, removed or gave a new entity, against the build before. */
export type IndexChanges<TId extends IndexId> = {
    readonly added: readonly TId[];
    readonly removed: readonly TId[];
    readonly updated: readonly TId[];
};

/**
 * What one read of an index hands back. `entities` follows `ids`. `changes` is relative to the
 * snapshot whose `revision` is `changesSince` — an index built over this one follows the changes
 * only from that snapshot, and rebuilds from any other.
 */
export type IndexSnapshot<TId extends IndexId, TEntity> = {
    readonly ids: readonly TId[];
    readonly entities: readonly TEntity[];
    readonly byId: ReadonlyMap<TId, TEntity>;
    readonly changes: IndexChanges<TId>;
    readonly revision: number;
    readonly changesSince: number;
};

/**
 * What every index answers. `read` hands back the whole snapshot and is what one index is built
 * over another with; components and thunks want the three lookups.
 */
export type Index<TState, TId extends IndexId, TEntity> = {
    readonly name: string;
    read: (state: TState) => IndexSnapshot<TId, TEntity>;
    getIds: (state: TState) => readonly TId[];
    getEntities: (state: TState) => readonly TEntity[];
    getById: (state: TState, id: TId) => TEntity | undefined;
};

/** Builds an id from its parts, the one way the index does — for a caller that has no entity. */
export type IdMaker<TParts, TId extends IndexId> = {
    createId: (parts: TParts) => TId;
};

export type IndexIdOf<TIndex> = TIndex extends { getById: (state: never, id: infer TId) => unknown }
    ? TId
    : never;

export type IndexEntityOf<TIndex> = TIndex extends {
    getEntities: (state: never) => readonly (infer TEntity)[];
}
    ? TEntity
    : never;

/** Any index read only for its snapshots. */
export type IndexSnapshotSource<TState, TId extends IndexId, TEntity> = {
    read: (state: TState) => IndexSnapshot<TId, TEntity>;
};

/** Where an index takes its entities from: a selector of them, or another index. */
export type IndexSource<TState, TEntity> =
    | ((state: TState) => Iterable<TEntity>)
    | { read: (state: TState) => { readonly entities: readonly TEntity[] } };

/**
 * How an id is made. With `createId`, the id's shape lives in the index and `getId` may be left
 * out when the entity itself has the parts; without it, `getId` says where an entity is filed.
 */
export type IdDefinition<TEntity, TId extends IndexId, TParts> = {
    /** The id from its parts, the one place its shape is written. Exposed as `index.createId`. */
    createId?: (parts: TParts) => TId;
} & (TEntity extends TParts
    ? { getId?: (entity: TEntity) => TId }
    : {
          /** The id an entity is filed under. Two entities of one source may not share it. */
          getId: (entity: TEntity) => TId;
      });

export type IndexDefinition<TState, TEntity, TId extends IndexId, TParts> = IdDefinition<
    TEntity,
    TId,
    TParts
> & {
    name: string;
    source: IndexSource<TState, TEntity>;
    /**
     * Whether a new entity is the one already held under its id, in which case the held object
     * stays. Shallow equality by default, which is what a selector that rebuilds its entities on
     * every write needs to come out stable.
     */
    isEqual?: (previous: TEntity, next: TEntity) => boolean;
};

/** Everything an index holds, looked up by a key other than the id: one key names many ids. */
export type SecondaryIndex<TState, TKey extends IndexKey, TId extends IndexId, TEntity> = {
    readonly name: string;
    getIds: (state: TState, key: TKey) => readonly TId[];
    getEntities: (state: TState, key: TKey) => readonly TEntity[];
    getKeys: (state: TState) => readonly TKey[];
};

export type KeyMaker<TParts, TKey extends IndexKey> = {
    createKey: (parts: TParts) => TKey;
};

export type SecondaryIndexKeyOf<TSecondaryIndex> = TSecondaryIndex extends {
    getIds: (state: never, key: infer TKey) => unknown;
}
    ? TKey
    : never;

/**
 * How a key is made. With `createKey`, the key's shape lives in the index and `getKeys` answers
 * parts — or may be left out when the entity itself has them; without it, `getKeys` answers keys.
 */
export type KeyDefinition<TEntity, TKey extends IndexKey, TParts> =
    | {
          /** The key from its parts, the one place its shape is written. Exposed as `index.createKey`. */
          createKey: (parts: TParts) => TKey;
          /** The parts of the key or keys an entity answers to; `undefined` files it under none. */
          getKeys?: (entity: TEntity) => TParts | readonly TParts[] | undefined;
      }
    | {
          createKey?: undefined;
          /** The key or keys an entity answers to; `undefined` files it under none. */
          getKeys: (entity: TEntity) => TKey | readonly TKey[] | undefined;
      };

export type SecondaryIndexDefinition<
    TState,
    TId extends IndexId,
    TEntity,
    TKey extends IndexKey,
    TParts,
> = KeyDefinition<TEntity, TKey, TParts> & {
    name: string;
    source: IndexSnapshotSource<TState, TId, TEntity>;
};

/**
 * Many source entities into one entity per id: each source entity expands into items, the items
 * sharing an id are folded into the entity. Driven by what the source says changed, so a write to
 * one source entity re-expands it and re-folds the ids it contributes to, and nothing else.
 */
export type AggregateIndexDefinition<
    TState,
    TSourceId extends IndexId,
    TSource,
    TItem,
    TId extends IndexId,
    TEntity,
> = {
    name: string;
    source: IndexSnapshotSource<TState, TSourceId, TSource>;
    /** One source entity into the items to fold. Called once per source entity while it is the same object. */
    expand: (source: TSource) => Iterable<TItem>;
    /** The id an item folds into; `undefined` leaves the item out. */
    getId: (item: TItem) => TId | undefined;
    /** Folds the items under one id, from `undefined` on every fold. */
    reduce: (accumulated: TEntity | undefined, item: TItem) => TEntity;
    /** Whether a re-folded entity is the one held. Shallow equality by default. */
    isEqual?: (previous: TEntity, next: TEntity) => boolean;
};

export type JoinedIdOf<TJoined> =
    TJoined extends IndexSnapshotSource<never, infer TId, unknown> ? TId : never;

export type JoinedEntityOf<TJoined> =
    TJoined extends IndexSnapshotSource<never, IndexId, infer TEntity> ? TEntity : never;

export type Join<TState> = Record<string, IndexSnapshotSource<TState, IndexId, unknown>>;

/**
 * The state every joined index needs, read off the join itself: one `infer` across all their
 * `read` parameters gives the intersection. `unknown` without a join, so it adds nothing.
 */
export type JoinStateOf<TJoin> = [keyof TJoin] extends [never]
    ? unknown
    : TJoin[keyof TJoin] extends { read: (state: infer TJoinState) => unknown }
      ? TJoinState
      : unknown;

export type JoinIds<TJoin> = { [TName in keyof TJoin]?: JoinedIdOf<TJoin[TName]> };

export type JoinedEntities<TJoin> = {
    [TName in keyof TJoin]: JoinedEntityOf<TJoin[TName]> | undefined;
};

/**
 * One entity per source entity, made from it and from the entities it is joined to in other
 * indexes. Made again only when its source entity changed or one of the joined entities did.
 */
export type DerivedIndexDefinition<
    TState,
    TId extends IndexId,
    TSource,
    TJoin extends Join<never>,
    TEntity,
> = {
    name: string;
    source: IndexSnapshotSource<TState, TId, TSource>;
    /** Other indexes to join; the derived index reads the state they need as well as the source's. */
    join?: TJoin;
    /** Which entity of each joined index a source entity is joined to; left out, none. */
    joinBy?: (source: TSource) => JoinIds<TJoin>;
    toEntity: (source: TSource, joined: JoinedEntities<TJoin>) => TEntity;
    /** The order of `ids` and `entities`; without it, the order of the source. */
    sort?: (left: TEntity, right: TEntity) => number;
    /** Whether a re-made entity is the one held. Shallow equality by default. */
    isEqual?: (previous: TEntity, next: TEntity) => boolean;
};
