import { type Branded } from '@trezor/type-utils';

export type IndexId = string;

export type IndexKey = string;

/** The id type an index named `TName` gives when its `getId` answers a plain string. */
export type BrandedIndexId<TName extends string> = string & Branded<`${TName}Id`>;

/** The key type a secondary index named `TName` gives when its `getKeys` answers plain strings. */
export type BrandedIndexKey<TName extends string> = string & Branded<`${TName}Key`>;

/** What `getId` gives, or the index's own brand when it gives a plain string. */
export type ResolvedIndexId<TName extends string, TGiven extends IndexId> = string extends TGiven
    ? BrandedIndexId<TName>
    : TGiven;

export type ResolvedIndexKey<TName extends string, TGiven extends IndexKey> = string extends TGiven
    ? BrandedIndexKey<TName>
    : TGiven;

/** Which ids a build added, removed or gave a new entity, against the build before. */
export type IndexChanges<TId extends IndexId> = {
    readonly added: readonly TId[];
    readonly removed: readonly TId[];
    readonly updated: readonly TId[];
};

/** What one read of an index hands back. `entities` follows `ids`. */
export type IndexSnapshot<TId extends IndexId, TEntity> = {
    readonly ids: readonly TId[];
    readonly entities: readonly TEntity[];
    readonly byId: ReadonlyMap<TId, TEntity>;
    readonly changes: IndexChanges<TId>;
};

export type Index<TState, TId extends IndexId, TEntity, TParts = never> = {
    readonly name: string;
    read: (state: TState) => IndexSnapshot<TId, TEntity>;
    getIds: (state: TState) => readonly TId[];
    getIdSet: (state: TState) => ReadonlySet<TId>;
    getEntities: (state: TState) => readonly TEntity[];
    getById: (state: TState, id: TId) => TEntity | undefined;
    getByIds: (state: TState, ids: readonly TId[]) => readonly TEntity[];
    /** The id an entity is filed under — for building one outside the index, from the entity. */
    getId: (entity: TEntity) => TId;
    /** Stamps a plain string as an id of this index. Prefer `createId` where parts are known. */
    asId: (value: string) => TId;
    /** Builds an id from its parts, the one way the index does — for a caller that has no entity. */
    createId: (parts: TParts) => TId;
};

// Each helper reads one member rather than matching the whole index, which has type parameters in
// both parameter and return positions and so matches nothing but itself.
export type IndexIdOf<TIndex> = TIndex extends { asId: (value: string) => infer TId } ? TId : never;

export type IndexEntityOf<TIndex> = TIndex extends {
    getEntities: (state: never) => readonly (infer TEntity)[];
}
    ? TEntity
    : never;

export type SecondaryIndexKeyOf<TSecondaryIndex> = TSecondaryIndex extends {
    asKey: (value: string) => infer TKey;
}
    ? TKey
    : never;

/**
 * Where an index takes its entities from: a selector of them, or another index — of any id type,
 * since only its entities are read.
 */
export type IndexSource<TState, TEntity> =
    | ((state: TState) => Iterable<TEntity>)
    | { read: (state: TState) => { readonly entities: readonly TEntity[] } };

/**
 * How an id is made. With `createId`, the id's shape lives in the index and `getId` may be left
 * out when the entity itself has the parts; without it, `getId` says where an entity is filed.
 */
export type IdDefinition<TEntity, TGivenId extends IndexId, TParts> = {
    /**
     * The id from its parts, the one place its shape is written. Exposed as `index.createId`. A
     * plain string is branded with the index name; an already branded id is kept.
     */
    createId?: (parts: TParts) => TGivenId;
} & (TEntity extends TParts
    ? { getId?: (entity: TEntity) => TGivenId }
    : {
          /** The id an entity is filed under. Two entities of one source may not share it. */
          getId: (entity: TEntity) => TGivenId;
      });

export type IndexDefinition<
    TState,
    TEntity,
    TName extends string,
    TGivenId extends IndexId,
    TParts,
> = IdDefinition<TEntity, TGivenId, TParts> & {
    name: TName;
    source: IndexSource<TState, TEntity>;
    /**
     * Whether a new entity is the one already held under its id, in which case the held object
     * stays. Shallow equality by default, which is what a selector that rebuilds its entities on
     * every write needs to come out stable.
     */
    isEqual?: (previous: TEntity, next: TEntity) => boolean;
};

/** Everything an index holds, looked up by a key other than the id: one key names many ids. */
export type SecondaryIndex<
    TState,
    TKey extends IndexKey,
    TId extends IndexId,
    TEntity,
    TParts = never,
> = {
    readonly name: string;
    getIds: (state: TState, key: TKey) => readonly TId[];
    getIdSet: (state: TState, key: TKey) => ReadonlySet<TId>;
    getEntities: (state: TState, key: TKey) => readonly TEntity[];
    getKeys: (state: TState) => readonly TKey[];
    getKeysOf: (state: TState, id: TId) => readonly TKey[];
    /** The keys an entity answers to — for building one outside the index, from the entity. */
    getKeysOfEntity: (entity: TEntity) => readonly TKey[];
    /** Stamps a plain string as a key of this index. Prefer `createKey` where parts are known. */
    asKey: (value: string) => TKey;
    /** Builds a key from its parts, the one way the index does — for a caller that has no entity. */
    createKey: (parts: TParts) => TKey;
};

/**
 * How a key is made. With `createKey`, the key's shape lives in the index and `getKeys` answers
 * parts — or may be left out when the entity itself has them; without it, `getKeys` answers keys.
 */
export type KeyDefinition<TEntity, TGivenKey extends IndexKey, TParts> =
    | {
          /**
           * The key from its parts, the one place its shape is written. Exposed as
           * `index.createKey`. A plain string is branded with the index name; an already branded
           * key is kept.
           */
          createKey: (parts: TParts) => TGivenKey;
          /** The parts of the key or keys an entity answers to; `undefined` files it under none. */
          getKeys?: (entity: TEntity) => TParts | readonly TParts[] | undefined;
      }
    | {
          createKey?: undefined;
          /** The key or keys an entity answers to; `undefined` files it under none. */
          getKeys: (entity: TEntity) => TGivenKey | readonly TGivenKey[] | undefined;
      };

export type SecondaryIndexDefinition<
    TState,
    TId extends IndexId,
    TEntity,
    TName extends string,
    TGivenKey extends IndexKey,
    TParts,
> = KeyDefinition<TEntity, TGivenKey, TParts> & {
    name: TName;
    /** The index to look up — of any parts type, since only its snapshots are read. */
    source: { read: (state: TState) => IndexSnapshot<TId, TEntity> };
};

/** Any index read only for its snapshots — of whatever id, entity and parts type. */
export type IndexSnapshotSource<TState, TId extends IndexId, TEntity> = {
    read: (state: TState) => IndexSnapshot<TId, TEntity>;
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
    TName extends string,
    TGivenId extends IndexId,
    TEntity,
> = {
    name: TName;
    source: IndexSnapshotSource<TState, TSourceId, TSource>;
    /** One source entity into the items to fold. Called once per source entity while it is the same object. */
    expand: (source: TSource) => Iterable<TItem>;
    /** The id an item folds into; `undefined` leaves the item out. */
    getId: (item: TItem) => TGivenId | undefined;
    /** Folds the items under one id, from `undefined` on every fold. */
    reduce: (accumulated: TEntity | undefined, item: TItem) => TEntity;
    /** Whether a re-folded entity is the one held. Shallow equality by default. */
    isEqual?: (previous: TEntity, next: TEntity) => boolean;
};

export type LookupIdOf<TLookup> =
    TLookup extends IndexSnapshotSource<never, infer TId, unknown> ? TId : never;

export type LookupEntityOf<TLookup> =
    TLookup extends IndexSnapshotSource<never, IndexId, infer TEntity> ? TEntity : never;

export type Lookups<TState> = Record<string, IndexSnapshotSource<TState, IndexId, unknown>>;

/**
 * The state every lookup needs, read off the lookups themselves: one `infer` across all their
 * `read` parameters gives the intersection. `unknown` without lookups, so it adds nothing.
 */
export type LookupStateOf<TLookups> = [keyof TLookups] extends [never]
    ? unknown
    : TLookups[keyof TLookups] extends { read: (state: infer TLookupState) => unknown }
      ? TLookupState
      : unknown;

export type LookupIds<TLookups> = { [TName in keyof TLookups]?: LookupIdOf<TLookups[TName]> };

export type LookupEntities<TLookups> = {
    [TName in keyof TLookups]: LookupEntityOf<TLookups[TName]> | undefined;
};

/**
 * One entity per source entity, derived from it and from the entities it names in other indexes.
 * Re-derived only when its source entity changed or one of the lookup entities it named did.
 */
export type DerivedIndexDefinition<
    TState,
    TId extends IndexId,
    TSource,
    TLookups extends Lookups<never>,
    TEntity,
> = {
    name: string;
    source: IndexSnapshotSource<TState, TId, TSource>;
    /** Other indexes to join; the derived index reads the state they need as well as the source's. */
    lookups?: TLookups;
    /** Which entity of each lookup a source entity depends on; left out, none. */
    getLookupIds?: (source: TSource) => LookupIds<TLookups>;
    derive: (source: TSource, lookups: LookupEntities<TLookups>) => TEntity;
    /** The order of `ids` and `entities`; without it, the order of the source. */
    sort?: (left: TEntity, right: TEntity) => number;
    /** Whether a re-derived entity is the one held. Shallow equality by default. */
    isEqual?: (previous: TEntity, next: TEntity) => boolean;
};
